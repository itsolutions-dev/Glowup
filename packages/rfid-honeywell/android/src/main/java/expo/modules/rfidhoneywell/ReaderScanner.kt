package expo.modules.rfidhoneywell

import android.annotation.SuppressLint
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.location.LocationManager
import android.os.Build
import android.os.SystemClock

// The service the SDK talks to on the reader. Whether the IH40 advertises it
// is for the spike to tell: the diagnostics log every advertisement.
private const val READER_SERVICE = "e093f3b5-00a3-a9e5-9eca-40016e0edc24"
private val READER_NAME = Regex("^IH4\\d", RegexOption.IGNORE_CASE)

// A device advertises many times a second: one report per this interval.
private const val REPORT_INTERVAL_MS = 500L

/**
 * The search for readers. The SDK has no public one, so this is a plain BLE
 * scan. `filter` keeps what looks like a Honeywell reader (its service, or a
 * name starting IH4x); without it every named device is reported.
 */
class ReaderScanner(
  private val context: Context,
  private val onFound: (Map<String, Any?>) -> Unit,
  private val onAdvert: (Map<String, Any?>) -> Unit,
  private val onStop: (code: String, message: String) -> Unit
) {
  private var callback: ScanCallback? = null
  private val lastReport = HashMap<String, Long>()

  @SuppressLint("MissingPermission")
  @Synchronized
  fun start(filter: Boolean) {
    val adapter = (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
    if (adapter == null || !adapter.isEnabled) {
      throw RfidException("ERR_BLUETOOTH_OFF", "Bluetooth is off.")
    }
    // Up to Android 11 a scan finds nothing with the location services off.
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R && !locationEnabled()) {
      throw RfidException(
        "ERR_LOCATION_OFF",
        "Location is off: Android 11 and earlier find no Bluetooth device without it."
      )
    }
    val scanner = adapter.bluetoothLeScanner
      ?: throw RfidException("ERR_BLUETOOTH_OFF", "Bluetooth is off.")
    stop()
    lastReport.clear()
    val next = object : ScanCallback() {
      override fun onScanResult(callbackType: Int, result: ScanResult) {
        report(result, filter)
      }

      override fun onBatchScanResults(results: MutableList<ScanResult>) {
        results.forEach { report(it, filter) }
      }

      override fun onScanFailed(errorCode: Int) {
        synchronized(this@ReaderScanner) { callback = null }
        onStop("ERR_SCAN_FAILED", "Android refused the scan (code $errorCode).")
      }
    }
    callback = next
    try {
      scanner.startScan(
        null,
        ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(),
        next
      )
    } catch (error: SecurityException) {
      callback = null
      throw RfidException("ERR_PERMISSION", "The Bluetooth scan permission is not granted.", error)
    }
  }

  @SuppressLint("MissingPermission")
  @Synchronized
  fun stop() {
    val running = callback ?: return
    callback = null
    try {
      (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)
        ?.adapter?.bluetoothLeScanner?.stopScan(running)
    } catch (_: Throwable) {
    }
  }

  @SuppressLint("MissingPermission")
  private fun report(result: ScanResult, filter: Boolean) {
    val address = result.device?.address ?: return
    val record = result.scanRecord
    val name = record?.deviceName ?: try {
      result.device.name
    } catch (_: SecurityException) {
      null
    }
    val services = record?.serviceUuids?.map { it.uuid.toString() } ?: emptyList()
    val likely = services.any { it.equals(READER_SERVICE, ignoreCase = true) } ||
      (name != null && READER_NAME.containsMatchIn(name))
    val now = SystemClock.elapsedRealtime()
    synchronized(this) {
      if (callback == null) return
      val last = lastReport[address]
      if (last != null && now - last < REPORT_INTERVAL_MS) return
      lastReport[address] = now
    }
    val manufacturers = record?.manufacturerSpecificData
    onAdvert(
      mapOf(
        "id" to address,
        "name" to name,
        "rssi" to result.rssi,
        "serviceUuids" to services,
        "manufacturerIds" to (0 until (manufacturers?.size() ?: 0)).map { manufacturers!!.keyAt(it) },
        "likelyReader" to likely
      )
    )
    if (filter && !likely) return
    if (!filter && name == null) return
    onFound(mapOf("id" to address, "name" to name, "rssi" to result.rssi, "likelyReader" to likely))
  }

  private fun locationEnabled(): Boolean {
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return false
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      manager.isLocationEnabled
    } else {
      @Suppress("DEPRECATION")
      manager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
        manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
  }
}
