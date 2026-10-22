package expo.modules.scannerzebra

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.HandlerThread
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** A failure the JS adapter maps to a `BarcodeScannerError` by its code. */
class ScannerException(code: String, message: String, cause: Throwable? = null) :
  CodedException(code, message, cause)

// Raised with every native change: JavaScript compares it with its own
// (ZEBRA_SCANNER_NATIVE_REVISION), since a Metro reload does not rebuild this.
private const val NATIVE_REVISION = 1

private const val DATAWEDGE = "com.symbol.datawedge"
private const val API = "com.symbol.datawedge.api."
private const val ACTION = API + "ACTION"
private const val RESULT_ACTION = API + "RESULT_ACTION"
private const val NOTIFICATION_ACTION = API + "NOTIFICATION_ACTION"
private const val EXTRA = "com.symbol.datawedge."
private const val CATEGORY = "android.intent.category.DEFAULT"

// How long DataWedge has to answer a command: it reinitialises the scanner
// on a configuration change, which takes a moment.
private const val COMMAND_TIMEOUT_MS = 5_000L

/**
 * DataWedge (`com.symbol.datawedge`, on every Zebra mobile computer) behind
 * the `@its/glowup-device/scanner` primitives. No SDK: commands go out as
 * broadcast intents and DataWedge answers with intents.
 *
 * The app's own DataWedge profile, associated with every activity of the
 * app, sends each decode to this module as a broadcast (intent output on,
 * keystroke output and data formatting off): other apps keep their profiles,
 * so their keyboard wedge is untouched. `open()` checks that DataWedge is
 * using the profile, switches the symbologies for the claim
 * (`SWITCH_SCANNER_PARAMS`, which DataWedge drops at the next profile switch)
 * and enables the barcode input; `close()` disables it. The parameters come
 * from JavaScript as DataWedge's own names (`decoder_qrcode`), so the mapping
 * is tested there.
 *
 * Threads: commands that wait for DataWedge's result run on `worker`; the
 * receiver runs on `events`, which completes them. State goes through
 * `lock`, and no command waits under it.
 */
class ZebraScannerModule : Module() {
  private val lock = Any()

  private var opened = false
  // The activity's state as Expo reports it: a profile switch while the app
  // is in front means DataWedge left the profile for another app.
  private var foreground = true
  private var profileName: String? = null
  // The data parameters the profile was last set up with (null: not yet).
  private var profileParams: Map<String, String>? = null
  private var notificationsOn = false
  private var activeProfile: String? = null

  // What each switched key holds in the profile (null: DataWedge did not say).
  private val originals = HashMap<String, String?>()
  private val applied = HashSet<String>()
  private var switched: Map<String, String> = emptyMap()

  private class Waiter(val id: String, val resultKey: String?) {
    val latch = CountDownLatch(1)
    @Volatile var result: Bundle? = null
  }
  private val waiters = mutableListOf<Waiter>()
  private var commands = 0

  @Volatile private var diagnostics = false
  @Volatile private var dataWedgeInstalled: Boolean? = null

  private var worker: HandlerThread? = null
  private var handler: Handler? = null
  private var events: HandlerThread? = null
  private var receiverRegistered = false

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val scanAction: String
    get() = context.packageName + ".GLOWUP_SCAN"

  override fun definition() = ModuleDefinition {
    Name("ZebraScanner")

    Events("onRead", "onClose", "onDiagnostic")

    OnCreate {
      val thread = HandlerThread("ZebraScanner").apply { start() }
      worker = thread
      handler = Handler(thread.looper)
    }

    OnDestroy {
      synchronized(lock) { opened = false }
      try {
        if (synchronized(lock) { notificationsOn }) {
          notifications("UNREGISTER_FOR_NOTIFICATION")
        }
        if (receiverRegistered) context.unregisterReceiver(receiver)
      } catch (_: Throwable) {
      }
      worker?.quitSafely()
      events?.quitSafely()
    }

    OnActivityEntersForeground {
      synchronized(lock) { foreground = true }
    }

    OnActivityEntersBackground {
      synchronized(lock) { foreground = false }
    }

    Function("getRevision") {
      NATIVE_REVISION
    }

    // Asked on every isSupported(): the package manager is asked once.
    Function("isDataWedgeInstalled") {
      dataWedgeInstalled ?: try {
        context.packageManager.getPackageInfo(DATAWEDGE, 0)
        true.also { dataWedgeInstalled = it }
      } catch (_: PackageManager.NameNotFoundException) {
        false.also { dataWedgeInstalled = it }
      } catch (_: Throwable) {
        // No context yet: asked again next time.
        false
      }
    }

    Function("setDiagnostics") { enabled: Boolean ->
      diagnostics = enabled
    }

    AsyncFunction("open") { config: Map<String, Any?>, promise: Promise ->
      post(promise) { open(config) }
    }

    AsyncFunction("close") { promise: Promise ->
      post(promise) { close() }
    }

    AsyncFunction("softwareTrigger") { pressed: Boolean ->
      if (!synchronized(lock) { opened }) {
        throw ScannerException("ERR_NOT_OPEN", "The scanner is not open.")
      }
      // DataWedge sends no result for it: nothing to wait for.
      send("SOFT_SCAN_TRIGGER", if (pressed) "START_SCANNING" else "STOP_SCANNING", null)
    }

    AsyncFunction("getScannerInfo") { promise: Promise ->
      post(promise) { scannerInfo() }
    }

    // For the diagnostics: the profile's stored barcode input parameters.
    AsyncFunction("getProfileParams") { promise: Promise ->
      post(promise) {
        ensureReceiver()
        val name = synchronized(lock) { profileName } ?: context.packageName
        storedParams(name)?.let { params ->
          params.keySet().associateWith { key -> params.getString(key) }
        } ?: emptyMap<String, String?>()
      }
    }

    AsyncFunction("getActiveProfile") { promise: Promise ->
      post(promise) {
        ensureReceiver()
        queryActiveProfile()
      }
    }
  }

  // --- Opening and closing ------------------------------------------------

  private fun open(config: Map<String, Any?>) {
    ensureReceiver()
    val name = (config["profileName"] as? String)?.takeIf { it.isNotBlank() } ?: context.packageName
    val profile = strings(config["profile"])
    val scanner = strings(config["scanner"])

    val status = query("GET_DATAWEDGE_STATUS", "RESULT_GET_DATAWEDGE_STATUS")
      ?: throw ScannerException("ERR_UNAVAILABLE", "DataWedge did not answer.")
    if (status.getString(API + "RESULT_GET_DATAWEDGE_STATUS").equals("disabled", ignoreCase = true)) {
      throw ScannerException("ERR_UNAVAILABLE", "DataWedge is disabled on this device.")
    }

    val setUp = synchronized(lock) { profileName != name || profileParams != profile }
    if (setUp) setUpProfile(name, profile)
    if (!synchronized(lock) { notificationsOn }) {
      notifications("REGISTER_FOR_NOTIFICATION")
      synchronized(lock) { notificationsOn = true }
    }

    // DataWedge picks the profile when the app's activity comes to the front;
    // the first time, the association may postdate that.
    var active = queryActiveProfile()
    if (active != name) {
      command("SWITCH_TO_PROFILE", name)
      active = queryActiveProfile()
    }
    if (active != name) {
      throw ScannerException(
        "ERR_UNAVAILABLE",
        "DataWedge is using the profile \"$active\", not \"$name\": bring the app to the front again."
      )
    }

    switchParams(name, scanner)
    command("SCANNER_INPUT_PLUGIN", "ENABLE_PLUGIN")
    synchronized(lock) { opened = true }
    diagnostic("opened", mapOf("profile" to name))
  }

  private fun close() {
    val (wasOpen, name) = synchronized(lock) {
      val was = opened
      opened = false
      was to profileName
    }
    if (!wasOpen) return
    // The barcode input plugin belongs to the active profile: in the
    // background that is another app's, which must keep its scanner.
    val active = if (synchronized(lock) { foreground }) queryActiveProfile() else null
    if (active != null && active == name) {
      command("SCANNER_INPUT_PLUGIN", "DISABLE_PLUGIN")
      diagnostic("closed", mapOf("disabled" to true))
    } else {
      diagnostic("closed", mapOf("disabled" to false, "active" to active))
    }
  }

  /**
   * Creates the profile when it is missing, associated with every activity
   * of the app, then stores its barcode input, intent output, keystroke
   * output and data formatting.
   */
  private fun setUpProfile(name: String, params: Map<String, String>) {
    val app = Bundle().apply {
      putString("PACKAGE_NAME", context.packageName)
      putStringArray("ACTIVITY_LIST", arrayOf("*"))
    }
    val create = Bundle().apply {
      putString("PROFILE_NAME", name)
      putString("PROFILE_ENABLED", "true")
      putString("CONFIG_MODE", "CREATE_IF_NOT_EXIST")
      putParcelableArray("APP_LIST", arrayOf(app))
    }
    command("SET_CONFIG", create)
      ?: throw ScannerException("ERR_UNAVAILABLE", "DataWedge did not answer.")

    val plugins = arrayListOf(
      plugin("BARCODE", false, params),
      plugin(
        "INTENT", true,
        mapOf(
          "intent_output_enabled" to "true",
          "intent_action" to scanAction,
          "intent_category" to CATEGORY,
          // 2: a broadcast.
          "intent_delivery" to "2"
        )
      ),
      plugin("KEYSTROKE", true, mapOf("keystroke_output_enabled" to "false")),
      plugin("BDF", true, mapOf("bdf_enabled" to "false")).apply {
        putString("OUTPUT_PLUGIN_NAME", "INTENT")
      }
    )
    val update = Bundle().apply {
      putString("PROFILE_NAME", name)
      putString("PROFILE_ENABLED", "true")
      putString("CONFIG_MODE", "UPDATE")
      putParcelableArrayList("PLUGIN_CONFIG", plugins)
    }
    command("SET_CONFIG", update)
    synchronized(lock) {
      if (profileName != name) {
        originals.clear()
        applied.clear()
        switched = emptyMap()
      }
      profileName = name
      profileParams = params
    }
    diagnostic("profileSetUp", mapOf("profile" to name, "action" to scanAction))
  }

  private fun plugin(name: String, reset: Boolean, params: Map<String, String>) = Bundle().apply {
    putString("PLUGIN_NAME", name)
    putString("RESET_CONFIG", reset.toString())
    putBundle("PARAM_LIST", Bundle().apply { params.forEach { (key, value) -> putString(key, value) } })
  }

  /**
   * Switches `wanted` for this claim, and puts back what an earlier claim
   * switched and this one leaves out, from the profile's stored values (a
   * request without symbologies keeps the profile's settings).
   */
  private fun switchParams(name: String, wanted: Map<String, String>) {
    val (unread, restore) = synchronized(lock) {
      wanted.keys.filter { it !in originals } to applied.filter { it !in wanted }
    }
    if (unread.isNotEmpty()) {
      val stored = storedParams(name)
      synchronized(lock) { unread.forEach { originals[it] = stored?.getString(it) } }
    }
    val params = HashMap(wanted)
    val unrestored = ArrayList<String>()
    for (key in restore) {
      val original = synchronized(lock) { originals[key] }
      if (original != null) params[key] = original else unrestored.add(key)
    }
    if (params.isNotEmpty()) command("SWITCH_SCANNER_PARAMS", bundleOf(params))
    synchronized(lock) {
      applied.clear()
      applied.addAll(wanted.keys)
      switched = wanted
    }
    diagnostic(
      "applied",
      mapOf("switched" to wanted.size, "restored" to restore, "unrestored" to unrestored)
    )
  }

  /** The profile's stored barcode input parameters (`GET_CONFIG`). */
  private fun storedParams(name: String): Bundle? {
    val request = Bundle().apply {
      putString("PROFILE_NAME", name)
      putBundle("PLUGIN_CONFIG", Bundle().apply {
        putStringArrayList("PLUGIN_NAME", arrayListOf("BARCODE"))
      })
    }
    val result = query("GET_CONFIG", "RESULT_GET_CONFIG", request) ?: return null
    val config = result.getBundle(API + "RESULT_GET_CONFIG") ?: return null
    @Suppress("DEPRECATION")
    val plugins = config.get("PLUGIN_CONFIG")
    val barcode = when (plugins) {
      is Bundle -> plugins
      is List<*> -> plugins.filterIsInstance<Bundle>().firstOrNull()
      else -> null
    }
    return barcode?.getBundle("PARAM_LIST")
  }

  private fun queryActiveProfile(): String? =
    query("GET_ACTIVE_PROFILE", "RESULT_GET_ACTIVE_PROFILE")
      ?.getString(API + "RESULT_GET_ACTIVE_PROFILE")
      .also { synchronized(lock) { activeProfile = it } }

  private fun scannerInfo(): Map<String, Any?> {
    ensureReceiver()
    val version = query("GET_VERSION_INFO", "RESULT_GET_VERSION_INFO")
      ?.getBundle(API + "RESULT_GET_VERSION_INFO")
      ?: throw ScannerException("ERR_UNAVAILABLE", "DataWedge did not answer.")
    @Suppress("DEPRECATION")
    val listed = query("ENUMERATE_SCANNERS", "RESULT_ENUMERATE_SCANNERS")
      ?.get(API + "RESULT_ENUMERATE_SCANNERS")
    val scanners = (listed as? List<*>)?.filterIsInstance<Bundle>() ?: emptyList()
    return mapOf(
      "datawedge" to version.getString("DATAWEDGE"),
      "barcodeScanning" to version.getString("BARCODE_SCANNING"),
      "decoderLibrary" to version.getString("DECODER_LIBRARY"),
      "firmware" to (version.getStringArray("SCANNER_FIRMWARE")?.toList() ?: emptyList<String>()),
      "scanners" to scanners.map { scanner ->
        @Suppress("DEPRECATION")
        mapOf(
          "name" to scanner.getString("SCANNER_NAME"),
          "index" to (scanner.get("SCANNER_INDEX") as? Number)?.toDouble(),
          "identifier" to scanner.getString("SCANNER_IDENTIFIER"),
          "connected" to (scanner.get("SCANNER_CONNECTION_STATE") as? Boolean)
        )
      }
    )
  }

  // --- DataWedge's intents ------------------------------------------------

  /** Sends a command and waits for its result; `null` when none came in time. */
  private fun command(name: String, value: Any): Bundle? = await(name, value, null, true)

  /** Sends a query and waits for the result extra it answers with. */
  private fun query(name: String, resultKey: String, value: Any = ""): Bundle? =
    await(name, value, API + resultKey, false)

  private fun await(name: String, value: Any, resultKey: String?, sendResult: Boolean): Bundle? {
    val waiter = synchronized(lock) {
      commands += 1
      Waiter("glowup-$commands", resultKey).also { waiters.add(it) }
    }
    send(name, value, waiter.id, sendResult)
    val answered = waiter.latch.await(COMMAND_TIMEOUT_MS, TimeUnit.MILLISECONDS)
    synchronized(lock) { waiters.remove(waiter) }
    val result = waiter.result
    diagnostic(
      "command",
      mapOf(
        "command" to name,
        "value" to plain(value),
        "answered" to answered,
        "result" to result?.getString("RESULT"),
        "info" to result?.let { plain(it) }
      )
    )
    return result
  }

  private fun send(name: String, value: Any, id: String?, sendResult: Boolean = false) {
    val intent = Intent(ACTION).setPackage(DATAWEDGE)
    when (value) {
      is Bundle -> intent.putExtra(API + name, value)
      is Boolean -> intent.putExtra(API + name, value)
      else -> intent.putExtra(API + name, value.toString())
    }
    if (id != null) intent.putExtra("COMMAND_IDENTIFIER", id)
    if (sendResult) intent.putExtra("SEND_RESULT", "COMPLETE_RESULT")
    context.sendBroadcast(intent)
  }

  private fun notifications(command: String) {
    for (type in listOf("SCANNER_STATUS", "PROFILE_SWITCH")) {
      send(
        command,
        Bundle().apply {
          putString(API + "APPLICATION_NAME", context.packageName)
          putString(API + "NOTIFICATION_TYPE", type)
        },
        null
      )
    }
  }

  private fun ensureReceiver() {
    if (receiverRegistered) return
    val thread = HandlerThread("ZebraScanner-events").apply { start() }
    events = thread
    val filter = IntentFilter().apply {
      addAction(scanAction)
      addAction(RESULT_ACTION)
      addAction(NOTIFICATION_ACTION)
      // DataWedge's intents carry it, and a filter must name every category.
      addCategory(CATEGORY)
    }
    // DataWedge is another app: the receiver must be exported.
    if (Build.VERSION.SDK_INT >= 33) {
      context.registerReceiver(receiver, filter, null, Handler(thread.looper), Context.RECEIVER_EXPORTED)
    } else {
      context.registerReceiver(receiver, filter, null, Handler(thread.looper))
    }
    receiverRegistered = true
  }

  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      when (intent.action) {
        RESULT_ACTION -> onResult(intent)
        NOTIFICATION_ACTION -> onNotification(intent)
        else -> if (intent.action == scanAction) onScan(intent)
      }
    }
  }

  private fun onResult(intent: Intent) {
    val extras = intent.extras ?: return
    val id = extras.getString("COMMAND_IDENTIFIER")
    val waiter = synchronized(lock) {
      waiters.firstOrNull { id != null && it.id == id && (it.resultKey == null || extras.containsKey(it.resultKey)) }
        ?: waiters.firstOrNull { it.resultKey != null && extras.containsKey(it.resultKey) }
    }
    if (waiter == null) {
      diagnostic("result", mapOf("unclaimed" to plain(extras)))
      return
    }
    waiter.result = extras
    waiter.latch.countDown()
  }

  private fun onNotification(intent: Intent) {
    val bundle = intent.getBundleExtra(API + "NOTIFICATION") ?: return
    val type = bundle.getString("NOTIFICATION_TYPE")
    val profile = bundle.getString("PROFILE_NAME")
    diagnostic("notification", mapOf("notification" to type, "status" to bundle.getString("STATUS"), "profile" to profile))
    if (type != "PROFILE_SWITCH") return
    val claim = synchronized(lock) {
      activeProfile = profile
      Claim(opened, profileName, foreground, switched)
    }
    if (!claim.open) return
    if (profile == claim.profile) {
      // DataWedge dropped the switched parameters with the switch.
      if (claim.switched.isNotEmpty()) {
        handler?.post { command("SWITCH_SCANNER_PARAMS", bundleOf(claim.switched)) }
      }
    } else if (claim.foreground) {
      lost("ERR_UNAVAILABLE", "DataWedge switched to the profile \"$profile\".")
    }
  }

  private fun onScan(intent: Intent) {
    val read = mapOf(
      "data" to (intent.getStringExtra(EXTRA + "data_string") ?: ""),
      "labelType" to intent.getStringExtra(EXTRA + "label_type"),
      "source" to intent.getStringExtra(EXTRA + "source"),
      "receivedAt" to System.currentTimeMillis().toDouble()
    )
    val open = synchronized(lock) { opened }
    if (diagnostics) {
      @Suppress("DEPRECATION")
      val bytes = (intent.extras?.get(EXTRA + "decode_data") as? List<*>)
        ?.filterIsInstance<ByteArray>()
        ?.joinToString(" ") { hex(it) }
      diagnostic(
        "read",
        read + mapOf(
          "delivered" to open,
          "decodedMode" to intent.getStringExtra(EXTRA + "decoded_mode"),
          "bytes" to bytes
        )
      )
    }
    if (open) sendEvent("onRead", read)
  }

  /** The claim ended without close(): JavaScript hears it once. */
  private fun lost(code: String, message: String) {
    synchronized(lock) {
      if (!opened) return
      opened = false
    }
    diagnostic("lost", mapOf("message" to message))
    sendEvent("onClose", mapOf("code" to code, "message" to message))
  }

  // --- Helpers ------------------------------------------------------------

  /** The claim's state, read at once under `lock`. */
  private class Claim(
    val open: Boolean,
    val profile: String?,
    val foreground: Boolean,
    val switched: Map<String, String>
  )

  /** Runs `block` on the worker, which may wait for DataWedge. */
  private fun post(promise: Promise, block: () -> Any?) {
    val run = Runnable {
      try {
        // open() and close() return Unit, which JavaScript reads as nothing.
        val value = block()
        promise.resolve(if (value == Unit) null else value)
      } catch (error: ScannerException) {
        promise.reject(error)
      } catch (error: Throwable) {
        promise.reject(ScannerException("ERR_DATAWEDGE", "DataWedge refused: $error", error))
      }
    }
    val h = handler
    if (h == null) run.run() else h.post(run)
  }

  private fun strings(value: Any?): Map<String, String> =
    (value as? Map<*, *>)?.entries
      ?.mapNotNull { (key, item) -> if (key is String && item != null) key to item.toString() else null }
      ?.toMap()
      ?: emptyMap()

  private fun bundleOf(params: Map<String, String>) =
    Bundle().apply { params.forEach { (key, value) -> putString(key, value) } }

  private fun hex(bytes: ByteArray): String =
    bytes.take(64).joinToString("") { "%02x".format(it) } + if (bytes.size > 64) "…" else ""

  /** A Bundle as plain values, for the diagnostics. */
  private fun plain(value: Any?): Any? = when (value) {
    null, is Boolean, is String -> value
    is Number -> value.toDouble()
    is ByteArray -> hex(value)
    is Bundle -> {
      @Suppress("DEPRECATION")
      value.keySet().associateWith { key -> plain(value.get(key)) }
    }
    is Array<*> -> value.map { plain(it) }
    is Iterable<*> -> value.map { plain(it) }
    else -> value.toString()
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
