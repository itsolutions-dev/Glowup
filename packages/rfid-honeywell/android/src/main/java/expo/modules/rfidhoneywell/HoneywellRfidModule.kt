package expo.modules.rfidhoneywell

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.os.Handler
import android.os.HandlerThread
import com.honeywell.rfidservice.EventListener
import com.honeywell.rfidservice.ReaderVolume
import com.honeywell.rfidservice.RfidManager
import com.honeywell.rfidservice.TriggerMode
import com.honeywell.rfidservice.rfid.Gen2
import com.honeywell.rfidservice.rfid.OnTagReadListener
import com.honeywell.rfidservice.rfid.RfidReader
import com.honeywell.rfidservice.rfid.RfidReaderException
import com.honeywell.rfidservice.rfid.TagAdditionData
import com.honeywell.rfidservice.rfid.TagReadData
import com.honeywell.rfidservice.rfid.TagReadOption
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** A failure the JS adapter maps to an `RfidError` by its code. */
class RfidException(code: String, message: String, cause: Throwable? = null) :
  CodedException(code, message, cause)

// Reads reach JavaScript at most this often (plan R10): the SDK delivers
// batches many times a second.
private const val BATCH_INTERVAL_MS = 100L

// The SDK's tag time is 0 on the Bluetooth path: anything before 2001 is not
// a real time, and the arrival time stands in.
private const val EARLIEST_REAL_TIME = 1_000_000_000_000L

private enum class Mode { IDLE, INVENTORY, LOCATE, SINGLE }

/**
 * The Honeywell RFID SDK v1.1.0 behind the `@its/glowup-device/rfid`
 * primitives. One reader at a time, one mode at a time; the units stay the
 * SDK's here (RSSI as the reader reports it, power in centi-dBm) and the JS
 * adapter converts them, so the diagnostics see the raw values.
 *
 * Threads: the SDK calls back on its own threads; every state change goes
 * through `lock`, events are sent from the module's worker thread, and no
 * blocking SDK call runs under the lock.
 */
class HoneywellRfidModule : Module() {
  private val lock = Any()
  private var manager: RfidManager? = null
  private var creatingManager = false
  private val managerWaiters = mutableListOf<(RfidManager) -> Unit>()

  private var reader: RfidReader? = null
  private var readerId: String? = null
  private var state = "disconnected"
  private var keepConnected = false
  private var pendingConnect: Promise? = null

  private var mode = Mode.IDLE
  private var readTids = false
  private val pendingReads = ArrayList<Map<String, Any?>>()
  private var pendingLocate: Int? = null
  private var flushScheduled = false

  private var triggerHandover = false
  private var previousTriggerMode: TriggerMode? = null

  @Volatile private var diagnostics = false

  private var worker: HandlerThread? = null
  private var handler: Handler? = null
  private var scanner: ReaderScanner? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("HoneywellRfid")

    Events(
      "onConnection",
      "onTags",
      "onLocate",
      "onModeStop",
      "onTrigger",
      "onReaderFound",
      "onDiscoveryStop",
      "onDiagnostic"
    )

    OnCreate {
      val thread = HandlerThread("HoneywellRfid").apply { start() }
      worker = thread
      handler = Handler(thread.looper)
    }

    OnDestroy {
      scanner?.stop()
      val m = synchronized(lock) {
        keepConnected = false
        reader = null
        mode = Mode.IDLE
        manager
      }
      try {
        m?.removeEventListener(eventListener)
        m?.setAutoReconnect(false)
        m?.disconnect()
      } catch (_: Throwable) {
      }
      worker?.quitSafely()
    }

    Function("getConnection") {
      synchronized(lock) { connectionMap() }
    }

    Function("setDiagnostics") { enabled: Boolean ->
      diagnostics = enabled
    }

    AsyncFunction("connect") { mac: String, promise: Promise ->
      val address = mac.uppercase()
      if (!BluetoothAdapter.checkBluetoothAddress(address)) {
        promise.reject(RfidException("ERR_INVALID_ID", "$mac is not a Bluetooth address."))
        return@AsyncFunction
      }
      if (bluetoothAdapter()?.isEnabled != true) {
        promise.reject(RfidException("ERR_BLUETOOTH_OFF", "Bluetooth is off."))
        return@AsyncFunction
      }
      withManager(promise) { m -> connect(m, address, promise) }
    }

    AsyncFunction("disconnect") {
      disconnect()
    }

    AsyncFunction("startInventory") { tid: Boolean ->
      val r = beginMode(Mode.INVENTORY)
      synchronized(lock) { readTids = tid }
      val started = try {
        if (tid) r.read(TagAdditionData.TID_BANK, readOption()) else r.read(readOption())
      } catch (error: Throwable) {
        endMode(Mode.INVENTORY)
        throw RfidException("ERR_READER", "The reader could not start reading.", error)
      }
      if (!started) {
        endMode(Mode.INVENTORY)
        throw RfidException("ERR_READER", "The reader refused to start reading.")
      }
    }

    AsyncFunction("stopInventory") {
      stopReading(Mode.INVENTORY)
    }

    AsyncFunction("startLocate") { epc: String ->
      val r = beginMode(Mode.LOCATE)
      val started = try {
        // The SDK matches the EPC with String.equals against its uppercase hex.
        r.setLocateEPC(epc.uppercase())
        r.read(readOption())
      } catch (error: Throwable) {
        endMode(Mode.LOCATE)
        throw RfidException("ERR_READER", "The reader could not start the search.", error)
      }
      if (!started) {
        r.setLocateEPC("")
        endMode(Mode.LOCATE)
        throw RfidException("ERR_READER", "The reader refused to start the search.")
      }
    }

    AsyncFunction("stopLocate") {
      stopReading(Mode.LOCATE)
    }

    AsyncFunction("readOnce") { windowMs: Int, tid: Boolean ->
      val r = beginMode(Mode.SINGLE)
      try {
        val now = System.currentTimeMillis()
        val reads = if (tid) r.syncRead(TagAdditionData.TID_BANK, windowMs) else r.syncRead(windowMs)
        diagnostic("syncRead", mapOf("size" to (reads?.size ?: 0), "windowMs" to windowMs))
        (reads ?: emptyArray()).map { toRead(it, now, tid) }
      } catch (error: RfidException) {
        throw error
      } catch (error: Throwable) {
        throw RfidException("ERR_READER", "The reader could not read.", error)
      } finally {
        endMode(Mode.SINGLE)
      }
    }

    AsyncFunction("setTriggerHandover") { enabled: Boolean ->
      synchronized(lock) { triggerHandover = enabled }
      applyTriggerMode()
    }

    AsyncFunction("startDiscovery") { filter: Boolean ->
      val found = scanner ?: ReaderScanner(
        context,
        onFound = { reader -> sendEvent("onReaderFound", reader) },
        onAdvert = { advert -> diagnostic("advert", advert) },
        onStop = { code, message ->
          sendEvent("onDiscoveryStop", mapOf("code" to code, "message" to message))
        }
      ).also { scanner = it }
      found.start(filter)
    }

    AsyncFunction("stopDiscovery") {
      scanner?.stop()
    }

    AsyncFunction("getSettings") {
      val (m, r) = requireReader()
      guard {
        val power = r.antennaPower?.firstOrNull()
        mapOf(
          "power" to power?.readPower,
          "antennas" to (r.antennaPower?.size ?: 0),
          "session" to r.session?.ordinal,
          "volume" to m.readerVolume?.name,
          "region" to r.region?.name
        )
      }
    }

    AsyncFunction("setSettings") { power: Int?, session: Int?, volume: String? ->
      val (m, r) = requireReader()
      guard {
        if (power != null) {
          val powers = r.antennaPower ?: emptyArray()
          powers.forEach {
            it.readPower = power
            it.writePower = power
          }
          r.setAntennaPower(powers)
        }
        if (session != null) r.setSession(Gen2.Session.values()[session])
        if (volume != null) m.setReaderVolume(ReaderVolume.valueOf(volume))
      }
    }

    AsyncFunction("getBatteryLevel") {
      val (m, _) = requireReader()
      // A decimal string from the reader, "" when it did not answer.
      val raw = guard { m.batteryLevel }
      diagnostic("battery", mapOf("raw" to raw))
      raw
    }

    AsyncFunction("getReaderInfo") {
      val (m, r) = requireReader()
      guard {
        mapOf(
          "id" to synchronized(lock) { readerId },
          "serialNumber" to m.getSN(),
          "rfidSoftware" to m.rfidModuleSWVersion,
          "rfidHardware" to m.rfidModuleHWVersion,
          "bluetoothSoftware" to m.bluetoothModuleSwVersion,
          "bluetoothHardware" to m.bluetoothModuleHwVersion,
          "sdkVersion" to m.sdkVersionName,
          "region" to r.region?.name
        )
      }
    }
  }

  // --- Connection ---------------------------------------------------------

  private fun bluetoothAdapter(): BluetoothAdapter? =
    (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter

  /** Runs `block` on the worker once the SDK's service is bound. */
  private fun withManager(promise: Promise, block: (RfidManager) -> Unit) {
    val existing = synchronized(lock) { manager }
    if (existing != null) {
      post { block(existing) }
      return
    }
    val create = synchronized(lock) {
      managerWaiters.add(block)
      if (creatingManager) false else true.also { creatingManager = true }
    }
    if (!create) return
    try {
      // Binds the RfidService embedded in the AAR: no Honeywell app needed.
      RfidManager.create(context) { created ->
        diagnostic("managerCreated", mapOf("created" to (created != null)))
        val waiters = synchronized(lock) {
          creatingManager = false
          manager = created
          managerWaiters.toList().also { managerWaiters.clear() }
        }
        if (created == null) {
          promise.reject(RfidException("ERR_SDK", "The Honeywell RFID service did not start."))
          return@create
        }
        created.addEventListener(eventListener)
        waiters.forEach { post { it(created) } }
      }
    } catch (error: Throwable) {
      synchronized(lock) {
        creatingManager = false
        managerWaiters.clear()
      }
      promise.reject(RfidException("ERR_SDK", "The Honeywell RFID service did not start.", error))
    }
  }

  private fun connect(m: RfidManager, address: String, promise: Promise) {
    val (already, busy) = synchronized(lock) {
      (state == "connected" && readerId == address) to (state != "disconnected")
    }
    if (already) {
      promise.resolve(null)
      return
    }
    if (busy) disconnect()
    val replaced = synchronized(lock) {
      val previous = pendingConnect
      pendingConnect = promise
      keepConnected = true
      readerId = address
      previous
    }
    replaced?.reject(RfidException("ERR_CANCELLED", "Another connect() replaced this one."))
    setState("connecting")
    val started = try {
      m.setAutoReconnect(true)
      m.connect(address)
    } catch (error: Throwable) {
      diagnostic("connectThrew", mapOf("message" to error.toString()))
      false
    }
    diagnostic("connectStarted", mapOf("started" to started, "address" to address))
    if (!started) {
      failConnect(RfidException("ERR_CONNECT_FAILED", "The Honeywell SDK did not start connecting to $address."))
    }
  }

  private fun failConnect(error: RfidException) {
    val (promise, m) = synchronized(lock) {
      val p = pendingConnect
      pendingConnect = null
      keepConnected = false
      reader = null
      readerId = null
      p to manager
    }
    try {
      m?.setAutoReconnect(false)
      m?.disconnect()
    } catch (_: Throwable) {
    }
    setState("disconnected")
    promise?.reject(error)
  }

  private fun disconnect() {
    val (m, running, connecting) = synchronized(lock) {
      keepConnected = false
      val p = pendingConnect
      pendingConnect = null
      Triple(manager, mode, p)
    }
    connecting?.reject(RfidException("ERR_CANCELLED", "disconnect() ended the connection attempt."))
    if (running == Mode.INVENTORY || running == Mode.LOCATE) stopReading(running)
    restoreTriggerMode()
    try {
      m?.setAutoReconnect(false)
      m?.disconnect()
    } catch (_: Throwable) {
    }
    synchronized(lock) {
      reader = null
      readerId = null
      mode = Mode.IDLE
    }
    setState("disconnected")
  }

  private val eventListener = object : EventListener {
    override fun onDeviceConnected(device: Any?) {
      diagnostic("deviceConnected", mapOf("device" to device?.toString()))
      // The reader is usable only once createReader() answers.
      post { synchronized(lock) { manager }?.createReader() }
    }

    override fun onDeviceDisconnected(device: Any?) {
      diagnostic("deviceDisconnected", mapOf("device" to device?.toString()))
      post { onLinkLost() }
    }

    override fun onUsbDeviceAttached(device: Any?) {}

    override fun onUsbDeviceDetached(device: Any?) {}

    override fun onReaderCreated(success: Boolean, created: RfidReader?) {
      diagnostic("readerCreated", mapOf("success" to success))
      // Qualified: unqualified, the name resolves to this override, which
      // would post itself forever.
      post { this@HoneywellRfidModule.onReaderCreated(success, created) }
    }

    override fun onRfidTriggered(pressed: Boolean) {
      diagnostic("trigger", mapOf("pressed" to pressed))
      if (synchronized(lock) { triggerHandover }) {
        post { sendEvent("onTrigger", mapOf("pressed" to pressed)) }
      }
    }

    override fun onTriggerModeSwitched(triggerMode: TriggerMode?) {
      diagnostic("triggerMode", mapOf("mode" to triggerMode?.name))
    }

    override fun onReceivedFindingTag(value: Int) {
      // The SDK's locate value (RSSI / read count): only for the diagnostics,
      // the module computes its own from the filtered reads.
      diagnostic("findingTag", mapOf("value" to value))
    }
  }

  private fun onReaderCreated(success: Boolean, created: RfidReader?) {
    if (!success || created == null) {
      if (synchronized(lock) { pendingConnect } != null) {
        failConnect(RfidException("ERR_CONNECT_FAILED", "The reader connected, but the SDK could not create it."))
      }
      return
    }
    created.setOnTagReadListener(tagListener)
    val promise = synchronized(lock) {
      reader = created
      pendingConnect.also { pendingConnect = null }
    }
    applyTriggerMode()
    setState("connected")
    promise?.resolve(null)
  }

  private fun onLinkLost() {
    val (running, connecting, keep) = synchronized(lock) {
      reader = null
      val m = mode
      mode = Mode.IDLE
      Triple(m, pendingConnect != null, keepConnected)
    }
    if (connecting) {
      failConnect(RfidException("ERR_CONNECT_FAILED", "The reader dropped the connection while connecting."))
      return
    }
    if (running == Mode.INVENTORY || running == Mode.LOCATE) {
      clearPending()
      sendEvent(
        "onModeStop",
        mapOf("mode" to running.name.lowercase(), "code" to "ERR_DISCONNECTED", "message" to "The RFID reader disconnected.")
      )
    }
    setState(if (keep) "reconnecting" else "disconnected")
  }

  private fun setState(next: String) {
    val event = synchronized(lock) {
      if (state == next) return
      state = next
      connectionMap()
    }
    sendEvent("onConnection", event)
  }

  private fun connectionMap(): Map<String, Any?> =
    mapOf("state" to state, "readerId" to if (state == "disconnected") null else readerId)

  // --- Modes --------------------------------------------------------------

  private fun requireReader(): Pair<RfidManager, RfidReader> = synchronized(lock) {
    val m = manager
    val r = reader
    if (m == null || r == null || state != "connected") {
      throw RfidException("ERR_NOT_CONNECTED", "No RFID reader is connected.")
    }
    m to r
  }

  /** Claims the reader for `next`; the engine never starts two modes. */
  private fun beginMode(next: Mode): RfidReader {
    val (_, r) = requireReader()
    synchronized(lock) {
      if (mode != Mode.IDLE) {
        throw RfidException("ERR_BUSY", "The reader is already in ${mode.name.lowercase()} mode.")
      }
      mode = next
      pendingReads.clear()
      pendingLocate = null
    }
    return r
  }

  private fun endMode(expected: Mode) {
    synchronized(lock) { if (mode == expected) mode = Mode.IDLE }
  }

  private fun stopReading(expected: Mode) {
    val r = synchronized(lock) {
      if (mode != expected) return
      mode = Mode.IDLE
      reader
    }
    try {
      r?.stopRead()
      if (expected == Mode.LOCATE) r?.setLocateEPC("")
    } catch (_: Throwable) {
    }
    clearPending()
  }

  private fun clearPending() {
    synchronized(lock) {
      pendingReads.clear()
      pendingLocate = null
    }
  }

  private fun readOption() = TagReadOption().apply {
    setRssi(true)
    setReadCount(true)
    setAntennaId(true)
    setFrequency(true)
    setTimestamp(true)
  }

  private val tagListener = OnTagReadListener { batch ->
    // While locating, the SDK passes the searched tag alone, or nothing.
    if (batch == null || batch.isEmpty()) return@OnTagReadListener
    val now = System.currentTimeMillis()
    if (diagnostics) {
      diagnostic(
        "tags",
        mapOf("thread" to Thread.currentThread().name, "size" to batch.size, "sample" to rawRead(batch[0]))
      )
    }
    synchronized(lock) {
      when (mode) {
        Mode.INVENTORY -> batch.forEach { pendingReads.add(toRead(it, now, readTids)) }
        Mode.LOCATE -> batch.forEach { read ->
          pendingLocate = maxOf(pendingLocate ?: read.rssi, read.rssi)
        }
        else -> return@OnTagReadListener
      }
      if (!flushScheduled) {
        flushScheduled = true
        handler?.postDelayed(flush, BATCH_INTERVAL_MS)
      }
    }
  }

  private val flush = Runnable {
    val (reads, locate, running) = synchronized(lock) {
      flushScheduled = false
      val batch = ArrayList(pendingReads)
      pendingReads.clear()
      val value = pendingLocate
      pendingLocate = null
      Triple(batch, value, mode)
    }
    if (running == Mode.INVENTORY && reads.isNotEmpty()) {
      sendEvent("onTags", mapOf("reads" to reads))
    }
    if (running == Mode.LOCATE && locate != null) {
      sendEvent("onLocate", mapOf("rssi" to locate))
    }
  }

  private fun toRead(read: TagReadData, now: Long, tid: Boolean): Map<String, Any?> {
    val time = read.time?.time
    return mapOf(
      "epc" to read.epcHexStr,
      "rssi" to read.rssi,
      "antenna" to read.antenna,
      "readCount" to read.readCount,
      "frequency" to read.frequency,
      "timestamp" to (if (time != null && time >= EARLIEST_REAL_TIME) time else now).toDouble(),
      "tid" to if (tid) read.additionData?.takeIf { it.isNotEmpty() }?.toHex() else null
    )
  }

  private fun rawRead(read: TagReadData): Map<String, Any?> = mapOf(
    "epc" to read.epcHexStr,
    "rssi" to read.rssi,
    "antenna" to read.antenna,
    "readCount" to read.readCount,
    "frequency" to read.frequency,
    "time" to read.time?.time?.toDouble(),
    "additionData" to read.additionData?.toHex()
  )

  // --- Trigger ------------------------------------------------------------

  private fun applyTriggerMode() {
    val (m, wanted, connected) = synchronized(lock) { Triple(manager, triggerHandover, state == "connected" || reader != null) }
    if (m == null || !connected) return
    try {
      if (wanted) {
        val current = m.triggerMode
        if (current != TriggerMode.RFID) {
          synchronized(lock) { previousTriggerMode = current }
          m.setTriggerMode(TriggerMode.RFID)
        }
      } else {
        restoreTriggerMode()
      }
    } catch (error: Throwable) {
      diagnostic("triggerModeFailed", mapOf("message" to error.toString()))
    }
  }

  private fun restoreTriggerMode() {
    val (m, previous) = synchronized(lock) {
      val p = previousTriggerMode
      previousTriggerMode = null
      manager to p
    }
    if (m == null || previous == null) return
    try {
      m.setTriggerMode(previous)
    } catch (_: Throwable) {
    }
  }

  // --- Helpers ------------------------------------------------------------

  private fun <T> guard(run: () -> T): T = try {
    run()
  } catch (error: RfidException) {
    throw error
  } catch (error: RfidReaderException) {
    throw RfidException("ERR_READER", error.message ?: "The reader refused the request.", error)
  } catch (error: IllegalArgumentException) {
    throw RfidException("ERR_INVALID_ARGUMENT", error.message ?: "The reader does not take that value.", error)
  }

  private fun post(run: () -> Unit) {
    val h = handler
    if (h == null) run() else h.post { run() }
  }

  private fun diagnostic(type: String, detail: Map<String, Any?>) {
    if (!diagnostics) return
    val event = HashMap<String, Any?>(detail)
    event["type"] = type
    event["at"] = System.currentTimeMillis().toDouble()
    event["thread"] = Thread.currentThread().name
    sendEvent("onDiagnostic", event)
  }
}

internal fun ByteArray.toHex(): String = joinToString("") { "%02X".format(it) }
