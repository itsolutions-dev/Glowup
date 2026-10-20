package expo.modules.rfidzebra

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.os.Handler
import android.os.HandlerThread
import com.zebra.rfid.api3.BEEPER_VOLUME
import com.zebra.rfid.api3.ENUM_TRANSPORT
import com.zebra.rfid.api3.ENUM_TRIGGER_MODE
import com.zebra.rfid.api3.HANDHELD_TRIGGER_EVENT_TYPE
import com.zebra.rfid.api3.InvalidUsageException
import com.zebra.rfid.api3.MEMORY_BANK
import com.zebra.rfid.api3.OperationFailureException
import com.zebra.rfid.api3.RFIDReader
import com.zebra.rfid.api3.ReaderDevice
import com.zebra.rfid.api3.Readers
import com.zebra.rfid.api3.RfidEventsListener
import com.zebra.rfid.api3.RfidReadEvents
import com.zebra.rfid.api3.RfidStatusEvents
import com.zebra.rfid.api3.SESSION
import com.zebra.rfid.api3.START_TRIGGER_TYPE
import com.zebra.rfid.api3.STATUS_EVENT_TYPE
import com.zebra.rfid.api3.STOP_TRIGGER_TYPE
import com.zebra.rfid.api3.TagData
import com.zebra.rfid.api3.TriggerInfo
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** A failure the JS adapter maps to an `RfidError` by its code. */
class RfidException(code: String, message: String, cause: Throwable? = null) :
  CodedException(code, message, cause)

// Raised with every native change: JavaScript compares it with its own
// (ZEBRA_NATIVE_REVISION), since a Metro reload does not rebuild this.
private const val NATIVE_REVISION = 1

// Reads reach JavaScript at most this often (plan R10).
private const val BATCH_INTERVAL_MS = 100L

// The most tags taken from the SDK's buffer per read event.
private const val READ_BATCH = 100

// After an unexpected drop the module reconnects itself, after these waits,
// then every last one, as the Honeywell module does.
private val RECONNECT_DELAYS_MS = longArrayOf(1_000L, 3_000L, 5_000L, 10_000L)

// The SDK lists paired readers only: a discovery asks it again this often, so
// a reader paired meanwhile shows up.
private const val DISCOVERY_POLL_MS = 3_000L

// How long getBatteryLevel() waits for the reader's BATTERY_EVENT.
private const val BATTERY_TIMEOUT_MS = 3_000L

// The antenna every RFD40 setting goes to: the handheld has one.
private const val ANTENNA = 1

private enum class Mode { IDLE, INVENTORY, LOCATE }

private val SESSIONS = arrayOf(SESSION.SESSION_S0, SESSION.SESSION_S1, SESSION.SESSION_S2, SESSION.SESSION_S3)

private val VOLUMES = linkedMapOf(
  "QUIET" to BEEPER_VOLUME.QUIET_BEEP,
  "LOW" to BEEPER_VOLUME.LOW_BEEP,
  "MEDIUM" to BEEPER_VOLUME.MEDIUM_BEEP,
  "HIGH" to BEEPER_VOLUME.HIGH_BEEP
)

/**
 * The Zebra RFID SDK for Android (API3, 2.0.5.297) behind the
 * `@its/glowup-device/rfid` primitives, for an RFD40 Premium paired over
 * Bluetooth. One reader at a time, one mode at a time; the units stay the
 * SDK's here (RSSI as the reader reports it, power as an index into the
 * reader's table) and the JS adapter converts them, so the diagnostics see
 * the raw values.
 *
 * Threads: the SDK's connect(), disconnect() and reader list block, so they
 * run on the module's `link` thread or the caller's (Expo's module queue);
 * reads arrive on SDK threads. Every state change goes through `lock`, no
 * blocking SDK call runs under it, and events are sent from `worker`.
 */
class ZebraRfidModule : Module() {
  private val lock = Any()
  private var readers: Readers? = null

  private var reader: RFIDReader? = null
  private var readerId: String? = null
  private var readerName: String? = null
  private var state = "disconnected"
  private var keepConnected = false
  private var pendingConnect: Promise? = null
  // Raised by every connect() and disconnect(): an attempt from an older
  // generation that finishes late closes what it opened.
  private var generation = 0

  private var mode = Mode.IDLE
  private var readTids = false
  private val pendingReads = ArrayList<Map<String, Any?>>()
  private var pendingLocate: Int? = null
  private var flushScheduled = false

  private var reconnectAttempts = 0
  private var reconnectScheduled = false

  private var triggerHandover = false

  private var discovering = false
  private var discoveryFilter = true
  private val reported = HashSet<String>()

  private var batteryLatch: CountDownLatch? = null
  private var batteryLevel: Int? = null

  @Volatile private var diagnostics = false

  private var worker: HandlerThread? = null
  private var handler: Handler? = null
  private var linkThread: HandlerThread? = null
  private var link: Handler? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ZebraRfid")

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
      val thread = HandlerThread("ZebraRfid").apply { start() }
      worker = thread
      handler = Handler(thread.looper)
      val blocking = HandlerThread("ZebraRfid-link").apply { start() }
      linkThread = blocking
      link = Handler(blocking.looper)
    }

    OnDestroy {
      // No events: JavaScript is going away.
      val r = synchronized(lock) {
        discovering = false
        keepConnected = false
        generation++
        mode = Mode.IDLE
        reader.also { reader = null }
      }
      link?.removeCallbacksAndMessages(null)
      if (r != null) close(r)
      try {
        Readers.deattach(readerEvents)
        synchronized(lock) { readers.also { readers = null } }?.Dispose()
      } catch (_: Throwable) {
      }
      linkThread?.quitSafely()
      worker?.quitSafely()
    }

    Function("getRevision") {
      NATIVE_REVISION
    }

    Function("getConnection") {
      synchronized(lock) { connectionMap() }
    }

    Function("setDiagnostics") { enabled: Boolean ->
      diagnostics = enabled
    }

    AsyncFunction("connect") { id: String, promise: Promise ->
      val wanted = id.trim()
      if (wanted.isEmpty()) {
        promise.reject(RfidException("ERR_INVALID_ID", "connect() needs a reader's Bluetooth address or name."))
        return@AsyncFunction
      }
      if (bluetoothAdapter()?.isEnabled != true) {
        promise.reject(RfidException("ERR_BLUETOOTH_OFF", "Bluetooth is off."))
        return@AsyncFunction
      }
      // A Bluetooth address in the SDK's case; anything else is a reader's name.
      val upper = wanted.uppercase()
      connect(if (BluetoothAdapter.checkBluetoothAddress(upper)) upper else wanted, promise)
    }

    AsyncFunction("disconnect") {
      disconnect()
    }

    AsyncFunction("startInventory") { tid: Boolean ->
      val r = beginMode(Mode.INVENTORY)
      synchronized(lock) { readTids = tid }
      try {
        // With a TID: an inventory that reads each tag's TID bank, reported
        // through the same read events.
        if (tid) r.Actions.TagAccess.readEvent(tidReadParams(r), null, null) else r.Actions.Inventory.perform()
      } catch (error: Throwable) {
        endMode(Mode.INVENTORY)
        throw readerError("The reader could not start reading.", error)
      }
    }

    AsyncFunction("stopInventory") {
      stopReading(Mode.INVENTORY)
    }

    AsyncFunction("startLocate") { epc: String ->
      val r = beginMode(Mode.LOCATE)
      try {
        r.Actions.TagLocationing.Perform(epc.uppercase(), null, null)
      } catch (error: Throwable) {
        endMode(Mode.LOCATE)
        throw readerError("The reader could not start the search.", error)
      }
    }

    AsyncFunction("stopLocate") {
      stopReading(Mode.LOCATE)
    }

    AsyncFunction("setTriggerHandover") { enabled: Boolean ->
      synchronized(lock) { triggerHandover = enabled }
      if (enabled) applyTriggerMode()
    }

    AsyncFunction("startDiscovery") { filter: Boolean ->
      synchronized(lock) {
        discovering = true
        discoveryFilter = filter
        reported.clear()
      }
      link?.removeCallbacks(pollDiscovery)
      link?.post(pollDiscovery)
    }

    AsyncFunction("stopDiscovery") {
      synchronized(lock) { discovering = false }
      link?.removeCallbacks(pollDiscovery)
    }

    AsyncFunction("getSettings") {
      val r = requireReader()
      guard {
        val antennas = r.Config.Antennas
        val levels = r.ReaderCapabilities?.transmitPowerLevelValues ?: IntArray(0)
        diagnostic("powerLevels", mapOf("levels" to levels.toList()))
        mapOf(
          "powerIndex" to antennas.getAntennaRfConfig(ANTENNA)?.transmitPowerIndex,
          "powerLevels" to levels.toList(),
          "session" to antennas.getSingulationControl(ANTENNA)?.session.let { s -> SESSIONS.indexOfFirst { it == s } }.takeIf { it >= 0 },
          "volume" to VOLUMES.entries.firstOrNull { it.value == r.Config.beeperVolume }?.key,
          "region" to r.Config.regulatoryConfig?.region
        )
      }
    }

    AsyncFunction("setSettings") { powerIndex: Int?, session: Int?, volume: String? ->
      val r = requireReader()
      guard {
        val antennas = r.Config.Antennas
        if (powerIndex != null) {
          val rf = antennas.getAntennaRfConfig(ANTENNA)
          rf.transmitPowerIndex = powerIndex
          antennas.setAntennaRfConfig(ANTENNA, rf)
        }
        if (session != null) {
          val control = antennas.getSingulationControl(ANTENNA)
          control.session = SESSIONS.getOrNull(session)
            ?: throw RfidException("ERR_INVALID_ARGUMENT", "Session $session is not S0–S3.")
          antennas.setSingulationControl(ANTENNA, control)
        }
        if (volume != null) {
          r.Config.setBeeperVolume(
            VOLUMES[volume] ?: throw RfidException("ERR_INVALID_ARGUMENT", "$volume is not a beeper volume.")
          )
        }
      }
    }

    AsyncFunction("getBatteryLevel") {
      val r = requireReader()
      // The reader answers getDeviceStatus() with a BATTERY_EVENT.
      val latch = CountDownLatch(1)
      synchronized(lock) {
        batteryLatch = latch
        batteryLevel = null
      }
      val level = try {
        r.Config.getDeviceStatus(true, false, false)
        latch.await(BATTERY_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        synchronized(lock) { batteryLevel } ?: batteryStats(r)
      } catch (error: Throwable) {
        diagnostic("batteryFailed", mapOf("message" to error.toString()))
        batteryStats(r)
      } finally {
        synchronized(lock) { batteryLatch = null }
      }
      level ?: -1
    }

    AsyncFunction("getReaderInfo") {
      val r = requireReader()
      guard {
        val versions = HashMap<String, String>()
        try {
          r.Config.getDeviceVersionInfo(versions)
        } catch (error: Throwable) {
          diagnostic("versionsFailed", mapOf("message" to error.toString()))
        }
        diagnostic("versions", HashMap<String, Any?>(versions))
        val (id, name) = synchronized(lock) { readerId to readerName }
        mapOf(
          "id" to id,
          "name" to name,
          "model" to r.ReaderCapabilities?.modelName,
          "serialNumber" to r.ReaderCapabilities?.serialNumber,
          "firmware" to try {
            r.versionInfo()?.version
          } catch (_: Throwable) {
            null
          },
          "versions" to versions
        )
      }
    }
  }

  // --- Connection ---------------------------------------------------------

  private fun bluetoothAdapter(): BluetoothAdapter? =
    (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter

  /** The SDK's reader list over Bluetooth, created once (blocking: not on the JS thread). */
  private fun readers(): Readers {
    synchronized(lock) { readers }?.let { return it }
    val created = Readers(context, ENUM_TRANSPORT.BLUETOOTH)
    Readers.attach(readerEvents)
    synchronized(lock) {
      if (readers == null) readers = created
      return readers!!
    }
  }

  /** The paired reader `id` names: its Bluetooth address, or its name. */
  private fun findDevice(id: String): ReaderDevice? {
    val devices = readers().GetAvailableRFIDReaderList() ?: return null
    return devices.firstOrNull { it.address.equals(id, ignoreCase = true) || it.name == id }
  }

  private fun connect(id: String, promise: Promise) {
    val (already, busy) = synchronized(lock) {
      (state == "connected" && readerId == id) to (state != "disconnected")
    }
    if (already) {
      promise.resolve(null)
      return
    }
    if (busy) disconnect()
    val (replaced, attempt) = synchronized(lock) {
      val previous = pendingConnect
      pendingConnect = promise
      keepConnected = true
      readerId = id
      generation++
      previous to generation
    }
    replaced?.reject(RfidException("ERR_CANCELLED", "Another connect() replaced this one."))
    setState("connecting")
    cancelReconnect()
    postLink {
      try {
        val r = open(id, attempt)
        val waiting = synchronized(lock) {
          reader = r
          pendingConnect.also { pendingConnect = null }
        }
        applyTriggerMode()
        setState("connected")
        waiting?.resolve(null)
      } catch (error: RfidException) {
        failConnect(error, attempt)
      }
    }
  }

  /**
   * Opens and configures the reader `id` names (blocking). An attempt that
   * `disconnect()` or another `connect()` overtook closes the reader again.
   */
  private fun open(id: String, attempt: Int): RFIDReader {
    val device = try {
      findDevice(id)
    } catch (error: Throwable) {
      throw readerError("The Zebra SDK could not list the paired readers.", error)
    } ?: throw RfidException(
      "ERR_NOT_PAIRED",
      "$id is not a reader paired with this device: pair the RFD40 in Android's Bluetooth settings (or tap it, NFC) first."
    )
    val r = device.getRFIDReader()
      ?: throw RfidException("ERR_SDK", "The Zebra SDK gave no reader for $id.")
    val started = System.currentTimeMillis()
    diagnostic("connectStarted", mapOf("id" to id, "name" to device.name, "address" to device.address))
    try {
      if (!r.isConnected) r.connect()
    } catch (error: Throwable) {
      diagnostic("connectFailed", mapOf("message" to message(error)))
      throw RfidException("ERR_CONNECT_FAILED", "Could not connect to $id: ${message(error)}", error)
    }
    diagnostic(
      "connected",
      mapOf("ms" to (System.currentTimeMillis() - started).toDouble(), "transport" to r.transport, "host" to r.hostName)
    )
    if (!isCurrent(attempt)) {
      close(r)
      throw RfidException("ERR_CANCELLED", "disconnect() or another connect() ended this attempt.")
    }
    try {
      configure(r)
    } catch (error: Throwable) {
      close(r)
      throw readerError("The reader connected, but refused its configuration.", error)
    }
    synchronized(lock) { readerName = device.name }
    return r
  }

  private fun configure(r: RFIDReader) {
    try {
      r.Events.removeEventsListener(rfidEvents)
    } catch (_: Throwable) {
    }
    r.Events.addEventsListener(rfidEvents)
    r.Events.setHandheldEvent(true)
    r.Events.setTagReadEvent(true)
    r.Events.setAttachTagDataWithReadEvent(false)
    r.Events.setReaderDisconnectEvent(true)
    r.Events.setBatteryEvent(true)
    // Inventories run from perform() to stop(): the trigger is the app's.
    val triggers = TriggerInfo()
    triggers.StartTrigger.setTriggerType(START_TRIGGER_TYPE.START_TRIGGER_TYPE_IMMEDIATE)
    triggers.StopTrigger.setTriggerType(STOP_TRIGGER_TYPE.STOP_TRIGGER_TYPE_IMMEDIATE)
    r.Config.setStartTrigger(triggers.StartTrigger)
    r.Config.setStopTrigger(triggers.StopTrigger)
  }

  private fun close(r: RFIDReader) {
    try {
      r.Events.removeEventsListener(rfidEvents)
    } catch (_: Throwable) {
    }
    try {
      r.disconnect()
    } catch (_: Throwable) {
    }
  }

  private fun isCurrent(attempt: Int) = synchronized(lock) { generation == attempt && keepConnected }

  private fun failConnect(error: RfidException, attempt: Int) {
    val waiting = synchronized(lock) {
      // A newer connect() or disconnect() owns the state now.
      if (generation != attempt) return
      keepConnected = false
      reader = null
      readerId = null
      readerName = null
      pendingConnect.also { pendingConnect = null }
    }
    setState("disconnected")
    waiting?.reject(error)
  }

  private fun disconnect() {
    val (r, running, connecting) = synchronized(lock) {
      keepConnected = false
      generation++
      val p = pendingConnect
      pendingConnect = null
      Triple(reader, mode, p)
    }
    connecting?.reject(RfidException("ERR_CANCELLED", "disconnect() ended the connection attempt."))
    cancelReconnect()
    if (running != Mode.IDLE) stopReading(running)
    synchronized(lock) {
      reader = null
      readerId = null
      readerName = null
      mode = Mode.IDLE
    }
    if (r != null) close(r)
    setState("disconnected")
  }

  private fun onLinkLost(reason: String) {
    val (lost, running, keep) = synchronized(lock) {
      val r = reader
      reader = null
      val m = mode
      mode = Mode.IDLE
      Triple(r, m, keepConnected)
    }
    if (lost == null) return
    diagnostic("linkLost", mapOf("reason" to reason))
    if (running != Mode.IDLE) {
      clearPending()
      sendEvent(
        "onModeStop",
        mapOf("mode" to running.name.lowercase(), "code" to "ERR_DISCONNECTED", "message" to "The RFID reader disconnected.")
      )
    }
    postLink { close(lost) }
    if (!keep) {
      setState("disconnected")
      return
    }
    setState("reconnecting")
    if (!synchronized(lock) { reconnectScheduled }) scheduleReconnect(nextReconnectDelay())
  }

  // --- Reconnection -------------------------------------------------------

  private val reconnect = Runnable { attemptReconnect() }

  private fun nextReconnectDelay(): Long = synchronized(lock) {
    RECONNECT_DELAYS_MS[minOf(reconnectAttempts, RECONNECT_DELAYS_MS.size - 1)]
      .also { reconnectAttempts++ }
  }

  private fun scheduleReconnect(delayMs: Long) {
    synchronized(lock) { reconnectScheduled = true }
    link?.removeCallbacks(reconnect)
    link?.postDelayed(reconnect, delayMs)
  }

  private fun cancelReconnect() {
    synchronized(lock) {
      reconnectScheduled = false
      reconnectAttempts = 0
    }
    link?.removeCallbacks(reconnect)
  }

  /** On the link thread: the SDK's connect() blocks until it answers or gives up. */
  private fun attemptReconnect() {
    val (id, attempt, count) = synchronized(lock) {
      reconnectScheduled = false
      if (!keepConnected || state != "reconnecting") return
      Triple(readerId, generation, reconnectAttempts)
    }
    if (id == null) return
    diagnostic("reconnectAttempt", mapOf("attempt" to count, "id" to id))
    try {
      val r = open(id, attempt)
      synchronized(lock) { reader = r }
      cancelReconnect()
      applyTriggerMode()
      setState("connected")
    } catch (error: RfidException) {
      diagnostic("reconnectFailed", mapOf("code" to error.code, "message" to error.message))
      if (isCurrent(attempt)) scheduleReconnect(nextReconnectDelay())
    }
  }

  private val readerEvents = object : Readers.RFIDReaderEventHandler {
    override fun RFIDReaderAppeared(device: ReaderDevice?) {
      diagnostic("readerAppeared", mapOf("name" to device?.name, "address" to device?.address))
      // The reader is back in range: try now rather than at the next delay.
      val ours = synchronized(lock) {
        state == "reconnecting" &&
          device != null &&
          (device.address.equals(readerId, ignoreCase = true) || device.name == readerId)
      }
      if (ours) {
        link?.removeCallbacks(reconnect)
        link?.post(reconnect)
      }
    }

    override fun RFIDReaderDisappeared(device: ReaderDevice?) {
      diagnostic("readerDisappeared", mapOf("name" to device?.name, "address" to device?.address))
    }
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

  private fun requireReader(): RFIDReader = synchronized(lock) {
    val r = reader
    if (r == null || state != "connected") {
      throw RfidException("ERR_NOT_CONNECTED", "No RFID reader is connected.")
    }
    r
  }

  /** Claims the reader for `next`; the engine never starts two modes. */
  private fun beginMode(next: Mode): RFIDReader {
    val r = requireReader()
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
    val (r, tids) = synchronized(lock) {
      if (mode != expected) return
      mode = Mode.IDLE
      reader to readTids
    }
    try {
      when (expected) {
        Mode.INVENTORY -> if (tids) r?.Actions?.TagAccess?.stopAccess() else r?.Actions?.Inventory?.stop()
        Mode.LOCATE -> r?.Actions?.TagLocationing?.Stop()
        Mode.IDLE -> {}
      }
    } catch (error: Throwable) {
      diagnostic("stopFailed", mapOf("mode" to expected.name, "message" to message(error)))
    }
    clearPending()
  }

  private fun clearPending() {
    synchronized(lock) {
      pendingReads.clear()
      pendingLocate = null
    }
  }

  // The whole TID bank (count 0), with no access password.
  private fun tidReadParams(r: RFIDReader) = r.Actions.TagAccess.ReadAccessParams().apply {
    memoryBank = MEMORY_BANK.MEMORY_BANK_TID
    offset = 0
    count = 0
    accessPassword = 0L
  }

  private val rfidEvents = object : RfidEventsListener {
    override fun eventReadNotify(event: RfidReadEvents?) {
      val r = synchronized(lock) { reader } ?: return
      val tags: Array<TagData> = try {
        r.Actions.getReadTags(READ_BATCH)
      } catch (_: Throwable) {
        null
      } ?: return
      if (tags.isEmpty()) return
      onTags(tags)
    }

    override fun eventStatusNotify(event: RfidStatusEvents?) {
      val data = event?.StatusEventData ?: return
      when (data.statusEventType) {
        STATUS_EVENT_TYPE.HANDHELD_TRIGGER_EVENT -> {
          val press = data.HandheldTriggerEventData?.handheldEvent
          val pressed = when (press) {
            HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_PRESSED -> true
            HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_RELEASED -> false
            else -> null
          }
          diagnostic("trigger", mapOf("event" to press?.toString(), "pressed" to pressed))
          if (pressed != null && synchronized(lock) { triggerHandover }) {
            post { sendEvent("onTrigger", mapOf("pressed" to pressed)) }
          }
        }
        STATUS_EVENT_TYPE.DISCONNECTION_EVENT -> {
          val reason = data.DisconnectionEventData?.disconnectionEvent?.toString() ?: "unknown"
          post { onLinkLost(reason) }
        }
        STATUS_EVENT_TYPE.BATTERY_EVENT -> {
          val battery = data.BatteryData
          diagnostic(
            "battery",
            mapOf("level" to battery?.level, "charging" to battery?.charging, "cause" to battery?.cause)
          )
          val latch = synchronized(lock) {
            batteryLevel = battery?.level
            batteryLatch
          }
          latch?.countDown()
        }
        else -> diagnostic("status", mapOf("event" to data.statusEventType?.toString()))
      }
    }
  }

  private fun onTags(tags: Array<TagData>) {
    val now = System.currentTimeMillis()
    if (diagnostics) {
      diagnostic(
        "tags",
        mapOf("thread" to Thread.currentThread().name, "size" to tags.size, "sample" to rawRead(tags[0]))
      )
    }
    val located = ArrayList<Map<String, Any?>>()
    synchronized(lock) {
      when (mode) {
        Mode.INVENTORY -> tags.forEach { pendingReads.add(toRead(it, now, readTids)) }
        Mode.LOCATE -> tags.forEach { tag ->
          // Plan decision Z3: the searched tag's RSSI, in dBm like every other
          // read; the SDK's relative distance (0–100) goes to the diagnostics.
          val rssi = tag.getPeakRSSI().toInt()
          if (diagnostics) {
            located.add(
              mapOf(
                "rssi" to rssi,
                "hasLocation" to tag.isContainsLocationInfo,
                "relativeDistance" to if (tag.isContainsLocationInfo) tag.LocationInfo?.relativeDistance?.toInt() else null
              )
            )
          }
          if (rssi < 0) pendingLocate = maxOf(pendingLocate ?: rssi, rssi)
        }
        Mode.IDLE -> return
      }
      if (!flushScheduled) {
        flushScheduled = true
        handler?.postDelayed(flush, BATCH_INTERVAL_MS)
      }
    }
    located.forEach { diagnostic("locate", it) }
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

  // The SDK's tag times (SeenTime, SYSTEMTIME) are not relied on: the
  // arrival time stands in, as the contract's default.
  private fun toRead(tag: TagData, now: Long, tid: Boolean): Map<String, Any?> = mapOf(
    "epc" to tag.getTagID(),
    "rssi" to tag.getPeakRSSI().toInt(),
    "antenna" to tag.getAntennaID().toInt(),
    "seenCount" to tag.tagSeenCount,
    "timestamp" to now.toDouble(),
    "tid" to if (tid) tag.memoryBankData?.takeIf { it.isNotEmpty() } else null
  )

  private fun rawRead(tag: TagData): Map<String, Any?> = mapOf(
    "epc" to tag.getTagID(),
    "rssi" to tag.getPeakRSSI().toInt(),
    "antenna" to tag.getAntennaID().toInt(),
    "seenCount" to tag.tagSeenCount,
    "memoryBank" to tag.memoryBank?.toString(),
    "memoryBankData" to tag.memoryBankData,
    "opCode" to tag.opCode?.toString(),
    "hasLocation" to tag.isContainsLocationInfo,
    "channel" to tag.channel
  )

  // --- Trigger ------------------------------------------------------------

  /**
   * The RFD40's trigger to the RFID side while handed over. Released, the
   * presses simply stop reaching JavaScript: an RFD40 Premium has no imager
   * to give the trigger back to (the Premium Plus's is out of scope).
   */
  private fun applyTriggerMode() {
    val (r, wanted) = synchronized(lock) { reader to triggerHandover }
    if (r == null || !wanted) return
    try {
      r.Config.setTriggerMode(ENUM_TRIGGER_MODE.RFID_MODE, true)
      diagnostic("triggerMode", mapOf("mode" to "RFID_MODE"))
    } catch (error: Throwable) {
      diagnostic("triggerModeFailed", mapOf("message" to message(error)))
    }
  }

  // --- Discovery ----------------------------------------------------------

  // The SDK has no scan: its list holds the readers paired with this device.
  private val pollDiscovery: Runnable = object : Runnable {
    override fun run() {
      if (!synchronized(lock) { discovering }) return
      val devices = try {
        readers().GetAvailableRFIDReaderList() ?: arrayListOf()
      } catch (error: Throwable) {
        synchronized(lock) { discovering = false }
        sendEvent(
          "onDiscoveryStop",
          mapOf("code" to "ERR_DISCOVERY", "message" to "The Zebra SDK could not list the paired readers: ${message(error)}")
        )
        return
      }
      devices.forEach { device ->
        val id = device.address ?: device.name ?: return@forEach
        val likely = (device.name ?: "").uppercase().startsWith("RFD")
        val report = synchronized(lock) {
          discovering && (!discoveryFilter || likely) && reported.add(id)
        }
        if (report) {
          diagnostic(
            "pairedReader",
            mapOf("id" to id, "name" to device.name, "transport" to device.transport, "likelyReader" to likely)
          )
          sendEvent("onReaderFound", mapOf("id" to id, "name" to device.name, "likelyReader" to likely))
        }
      }
      if (synchronized(lock) { discovering }) link?.postDelayed(this, DISCOVERY_POLL_MS)
    }
  }

  // --- Helpers ------------------------------------------------------------

  private fun batteryStats(r: RFIDReader): Int? = try {
    r.Config.batteryStats?.percentage?.also { diagnostic("batteryStats", mapOf("percentage" to it)) }
  } catch (error: Throwable) {
    diagnostic("batteryStatsFailed", mapOf("message" to message(error)))
    null
  }

  private fun message(error: Throwable): String = when (error) {
    is OperationFailureException ->
      listOfNotNull(error.vendorMessage, error.statusDescription, error.results?.toString())
        .firstOrNull { it.isNotBlank() } ?: "The reader refused the request."
    is InvalidUsageException ->
      listOfNotNull(error.vendorMessage, error.info).firstOrNull { it.isNotBlank() } ?: "The SDK refused the request."
    else -> error.message ?: error.toString()
  }

  private fun readerError(prefix: String, error: Throwable): RfidException =
    error as? RfidException ?: RfidException("ERR_READER", "$prefix ${message(error)}", error)

  private fun <T> guard(run: () -> T): T = try {
    run()
  } catch (error: RfidException) {
    throw error
  } catch (error: OperationFailureException) {
    throw RfidException("ERR_READER", message(error), error)
  } catch (error: InvalidUsageException) {
    throw RfidException("ERR_INVALID_ARGUMENT", message(error), error)
  }

  private fun post(run: () -> Unit) {
    val h = handler
    if (h == null) run() else h.post { run() }
  }

  private fun postLink(run: () -> Unit) {
    val h = link
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
