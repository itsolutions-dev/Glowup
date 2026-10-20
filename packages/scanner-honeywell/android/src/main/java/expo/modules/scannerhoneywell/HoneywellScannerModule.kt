package expo.modules.scannerhoneywell

import android.content.Context
import android.os.Handler
import android.os.HandlerThread
import com.honeywell.aidc.AidcManager
import com.honeywell.aidc.BarcodeDeviceConnectionEvent
import com.honeywell.aidc.BarcodeFailureEvent
import com.honeywell.aidc.BarcodeReadEvent
import com.honeywell.aidc.BarcodeReader
import com.honeywell.aidc.BarcodeReaderInfo
import com.honeywell.aidc.InvalidScannerNameException
import com.honeywell.aidc.ScannerNotClaimedException
import com.honeywell.aidc.ScannerUnavailableException
import com.honeywell.aidc.TriggerStateChangeEvent
import com.honeywell.aidc.UnsupportedPropertyException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** A failure the JS adapter maps to a `BarcodeScannerError` by its code. */
class ScannerException(code: String, message: String, cause: Throwable? = null) :
  CodedException(code, message, cause)

// Raised with every native change: JavaScript compares it with its own
// (HONEYWELL_SCANNER_NATIVE_REVISION), since a Metro reload does not rebuild this.
private const val NATIVE_REVISION = 1

// AidcManager.create binds Honeywell's scanner service and answers through a
// callback; on a host without the service it may never answer.
private const val MANAGER_TIMEOUT_MS = 10_000L

/**
 * Honeywell's Data Collection SDK (`com.honeywell.aidc`) behind the
 * `@its/glowup-device/scanner` primitives: the host's own imager, claimed
 * while open. The properties to apply come from JavaScript as the SDK's own
 * keys (`DEC_QR_ENABLED`, `DPR_SUFFIX`), so the mapping is tested there; this
 * module applies them, remembers what each key held before it first changed
 * it, and puts back the ones a later request leaves out.
 *
 * Threads: the SDK calls back on its own threads; every state change goes
 * through `lock`, and no SDK call runs under it.
 */
class HoneywellScannerModule : Module() {
  private val lock = Any()
  private var manager: AidcManager? = null
  private var creatingManager = false
  private val managerWaiters = mutableListOf<Pair<(AidcManager) -> Unit, Promise>>()

  private var reader: BarcodeReader? = null
  private var readerName: String? = null
  private var claimed = false
  private var clientControl = false

  // The value each key held before this module first set it (null: unread).
  private val originals = HashMap<String, Any?>()
  private val applied = HashSet<String>()

  @Volatile private var diagnostics = false

  private var worker: HandlerThread? = null
  private var handler: Handler? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("HoneywellScanner")

    Events("onRead", "onTrigger", "onClose", "onDiagnostic")

    OnCreate {
      val thread = HandlerThread("HoneywellScanner").apply { start() }
      worker = thread
      handler = Handler(thread.looper)
    }

    OnDestroy {
      val (r, m) = synchronized(lock) {
        claimed = false
        val pair = reader to manager
        reader = null
        manager = null
        pair
      }
      try {
        r?.removeBarcodeListener(barcodeListener)
        r?.removeTriggerListener(triggerListener)
        r?.release()
        r?.close()
      } catch (_: Throwable) {
      }
      try {
        m?.removeBarcodeDeviceListener(deviceListener)
        m?.close()
      } catch (_: Throwable) {
      }
      worker?.quitSafely()
    }

    Function("getRevision") {
      NATIVE_REVISION
    }

    Function("setDiagnostics") { enabled: Boolean ->
      diagnostics = enabled
    }

    AsyncFunction("open") { properties: Map<String, Any?>, triggerControl: String, promise: Promise ->
      withManager(promise) { m -> open(m, properties, triggerControl == "client", promise) }
    }

    AsyncFunction("close") {
      val r = synchronized(lock) {
        val wasClaimed = claimed
        claimed = false
        if (wasClaimed) reader else null
      }
      try {
        r?.release()
      } catch (error: Throwable) {
        diagnostic("releaseFailed", mapOf("message" to error.toString()))
      }
      if (r != null) diagnostic("released", emptyMap())
    }

    AsyncFunction("softwareTrigger") { pressed: Boolean ->
      val (r, client) = synchronized(lock) {
        val current = reader
        if (!claimed || current == null) {
          throw ScannerException("ERR_NOT_OPEN", "The scanner is not claimed.")
        }
        current to clientControl
      }
      try {
        if (client) drive(r, pressed) else r.softwareTrigger(pressed)
      } catch (error: ScannerNotClaimedException) {
        lostClaim("ERR_UNAVAILABLE", "The scanner service took the claim back.")
        throw ScannerException("ERR_NOT_OPEN", "The scanner is not claimed.", error)
      } catch (error: ScannerUnavailableException) {
        lostClaim("ERR_UNAVAILABLE", "The scanner is held elsewhere.")
        throw ScannerException("ERR_UNAVAILABLE", "The scanner is held elsewhere.", error)
      }
    }

    AsyncFunction("getScannerInfo") {
      val r = synchronized(lock) { reader }
        ?: throw ScannerException("ERR_NOT_OPEN", "The scanner has not been opened yet.")
      try {
        infoMap(r.info)
      } catch (error: ScannerUnavailableException) {
        throw ScannerException("ERR_UNAVAILABLE", "The scanner is held elsewhere.", error)
      }
    }

    // For the diagnostics: the scanners the service knows (internal, ring).
    AsyncFunction("listDevices") { promise: Promise ->
      withManager(promise) { m ->
        try {
          promise.resolve((m.listBarcodeDevices() ?: emptyList()).map { infoMap(it) })
        } catch (error: Throwable) {
          promise.reject(ScannerException("ERR_SDK", "The scanner service did not list its devices.", error))
        }
      }
    }

    // For the diagnostics: every property as the service holds it for this app.
    AsyncFunction("getAllProperties") {
      val r = synchronized(lock) { reader }
        ?: throw ScannerException("ERR_NOT_OPEN", "The scanner has not been opened yet.")
      (r.allProperties ?: emptyMap()).mapValues { (_, value) -> plain(value) }
    }
  }

  // --- Opening ------------------------------------------------------------

  /** Runs `block` on the worker once the scanner service is bound. */
  private fun withManager(promise: Promise, block: (AidcManager) -> Unit) {
    val existing = synchronized(lock) { manager }
    if (existing != null) {
      post { block(existing) }
      return
    }
    val create = synchronized(lock) {
      managerWaiters.add(block to promise)
      if (creatingManager) false else true.also { creatingManager = true }
    }
    if (!create) return
    handler?.postDelayed(managerTimeout, MANAGER_TIMEOUT_MS)
    try {
      AidcManager.create(context) { created -> onManager(created) }
    } catch (error: Throwable) {
      failWaiters(ScannerException("ERR_UNAVAILABLE", "The Honeywell scanner service did not start.", error))
    }
  }

  private fun onManager(created: AidcManager?) {
    handler?.removeCallbacks(managerTimeout)
    diagnostic("managerCreated", mapOf("created" to (created != null)))
    if (created == null) {
      failWaiters(ScannerException("ERR_UNAVAILABLE", "The Honeywell scanner service did not start."))
      return
    }
    // A manager that answers after the timeout is kept for the next open().
    val waiters = synchronized(lock) {
      creatingManager = false
      if (manager == null) manager = created
      managerWaiters.toList().also { managerWaiters.clear() }
    }
    created.addBarcodeDeviceListener(deviceListener)
    waiters.forEach { (block, _) -> post { block(created) } }
  }

  private val managerTimeout = Runnable {
    failWaiters(ScannerException("ERR_UNAVAILABLE", "The Honeywell scanner service did not answer."))
  }

  private fun failWaiters(error: ScannerException) {
    val waiters = synchronized(lock) {
      creatingManager = false
      managerWaiters.toList().also { managerWaiters.clear() }
    }
    waiters.forEach { (_, promise) -> promise.reject(error) }
  }

  private fun open(m: AidcManager, properties: Map<String, Any?>, client: Boolean, promise: Promise) {
    try {
      val r = synchronized(lock) { reader } ?: createReader(m)
      val wanted = HashMap(properties)
      wanted[BarcodeReader.PROPERTY_TRIGGER_CONTROL_MODE] =
        if (client) BarcodeReader.TRIGGER_CONTROL_MODE_CLIENT_CONTROL
        else BarcodeReader.TRIGGER_CONTROL_MODE_AUTO_CONTROL
      apply(r, wanted)
      val claim = synchronized(lock) {
        clientControl = client
        !claimed
      }
      if (claim) {
        // Applied before the claim, so the first decode already uses them.
        r.claim()
        synchronized(lock) { claimed = true }
        diagnostic("claimed", mapOf("reader" to readerName))
      }
      promise.resolve(null)
    } catch (error: ScannerException) {
      promise.reject(error)
    } catch (error: ScannerUnavailableException) {
      promise.reject(ScannerException("ERR_UNAVAILABLE", "The scanner is held elsewhere.", error))
    } catch (error: Throwable) {
      promise.reject(ScannerException("ERR_SDK", "The scanner could not be opened.", error))
    }
  }

  private fun createReader(m: AidcManager): BarcodeReader {
    val created = try {
      // The host's internal imager, the one the trigger drives.
      m.createBarcodeReader()
    } catch (error: InvalidScannerNameException) {
      throw ScannerException("ERR_NO_SCANNER", "This device has no scanner the SDK reaches.", error)
    } ?: throw ScannerException("ERR_NO_SCANNER", "This device has no scanner the SDK reaches.")
    created.addBarcodeListener(barcodeListener)
    created.addTriggerListener(triggerListener)
    val name = try {
      created.info?.name
    } catch (_: Throwable) {
      null
    }
    synchronized(lock) {
      reader = created
      readerName = name
    }
    diagnostic("readerCreated", mapOf("reader" to name))
    return created
  }

  /**
   * Sets `wanted`, and puts back what an earlier request set and this one
   * leaves out (a request without symbologies keeps the device's settings).
   * A key the scanner does not have is skipped, and reported.
   */
  private fun apply(r: BarcodeReader, wanted: Map<String, Any?>) {
    val (unread, restore) = synchronized(lock) {
      wanted.keys.filter { it !in originals } to applied.filter { it !in wanted }
    }
    if (unread.isNotEmpty()) {
      val current = try {
        r.getProperties(unread.toSet()) ?: emptyMap()
      } catch (_: Throwable) {
        emptyMap<String, Any?>()
      }
      synchronized(lock) { unread.forEach { originals[it] = current[it] } }
    }
    val skipped = ArrayList<String>()
    for ((key, value) in wanted) {
      if (set(r, key, value)) synchronized(lock) { applied.add(key) } else skipped.add(key)
    }
    for (key in restore) {
      val original = synchronized(lock) { originals[key] }
      if (original != null) set(r, key, original)
      synchronized(lock) { applied.remove(key) }
    }
    diagnostic(
      "applied",
      mapOf("set" to wanted.size - skipped.size, "skipped" to skipped, "restored" to restore)
    )
  }

  private fun set(r: BarcodeReader, key: String, value: Any?): Boolean = try {
    when (value) {
      is Boolean -> true.also { r.setProperty(key, value) }
      // JavaScript numbers arrive as Double; the SDK's are int.
      is Number -> true.also { r.setProperty(key, value.toInt()) }
      is String -> true.also { r.setProperty(key, value) }
      else -> false
    }
  } catch (_: UnsupportedPropertyException) {
    false
  }

  // --- Events -------------------------------------------------------------

  private val barcodeListener = object : BarcodeReader.BarcodeListener {
    override fun onBarcodeEvent(event: BarcodeReadEvent) {
      val read = mapOf(
        "data" to event.barcodeData,
        "codeId" to event.codeId,
        "aimId" to event.aimId,
        "charset" to event.charset?.name(),
        "timestamp" to event.timestamp,
        "receivedAt" to System.currentTimeMillis().toDouble()
      )
      diagnostic("read", read)
      if (!synchronized(lock) { claimed }) return
      sendEvent("onRead", read)
    }

    override fun onFailureEvent(event: BarcodeFailureEvent) {
      diagnostic("noRead", mapOf("timestamp" to event.timestamp))
    }
  }

  private val triggerListener = object : BarcodeReader.TriggerListener {
    override fun onTriggerEvent(event: TriggerStateChangeEvent) {
      val pressed = event.state
      val (r, client, open) = synchronized(lock) { Triple(reader, clientControl, claimed) }
      diagnostic("trigger", mapOf("pressed" to pressed, "client" to client, "claimed" to open))
      if (!open || r == null) return
      if (client) {
        try {
          drive(r, pressed)
        } catch (error: Throwable) {
          diagnostic("triggerFailed", mapOf("message" to error.toString()))
        }
      }
      sendEvent("onTrigger", mapOf("pressed" to pressed))
    }
  }

  private val deviceListener = AidcManager.BarcodeDeviceListener { event: BarcodeDeviceConnectionEvent ->
    val name = event.barcodeReaderInfo?.name
    val connected = event.connectionStatus == AidcManager.BARCODE_DEVICE_CONNECTED
    diagnostic("device", mapOf("name" to name, "connected" to connected))
    val ours = synchronized(lock) { claimed && name != null && name == readerName }
    if (!connected && ours) lostClaim("ERR_UNAVAILABLE", "The scanner disconnected.")
  }

  /** What the service does on a trigger in auto control: aim, light, decode. */
  private fun drive(r: BarcodeReader, pressed: Boolean) {
    r.aim(pressed)
    r.light(pressed)
    r.decode(pressed)
  }

  /** The claim ended without close(): JavaScript hears it once. */
  private fun lostClaim(code: String, message: String) {
    synchronized(lock) {
      if (!claimed) return
      claimed = false
    }
    sendEvent("onClose", mapOf("code" to code, "message" to message))
  }

  // --- Helpers ------------------------------------------------------------

  private fun infoMap(info: BarcodeReaderInfo?): Map<String, Any?> = mapOf(
    "name" to info?.name,
    "friendlyName" to info?.friendlyName,
    "scannerId" to info?.scannerId,
    "firmwareVersion" to info?.scannerFirmwareVersion,
    "serialNumber" to info?.scannerSerialNumber,
    "versionNumber" to info?.scannerVersionNumber,
    "controlLogicVersion" to info?.controlLogicVersion,
    "fullDecodeVersion" to info?.fullDecodeVersion,
    "fastDecodeVersion" to info?.fastDecodeVersion
  )

  private fun plain(value: Any?): Any? = when (value) {
    null, is Boolean, is String -> value
    is Number -> value.toDouble()
    else -> value.toString()
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
