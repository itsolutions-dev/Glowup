package its.glowup.pdf

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.graphics.pdf.PdfRendererPreV
import android.graphics.pdf.models.PageMatchBounds
import android.net.Uri
import android.os.Build
import android.os.ParcelFileDescriptor
import android.os.ext.SdkExtensions
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.Executors

/**
 * `PdfRenderer` behind the functions of `PdfNative` (src/types.ts). Documents stay open between
 * calls, keyed by their file URI, until `close`.
 *
 * `PdfRenderer` is not thread safe and shows one page at a time, so every call runs on one
 * thread and `documents` needs no lock.
 */
class GlowupPdfModule : Module() {
  private class Document(
    val renderer: PdfRenderer,
    val descriptor: ParcelFileDescriptor,
    val file: File,
  ) {
    val images = mutableListOf<File>()

    // Android 11 to 14 search through PdfRendererPreV, which needs a file descriptor of its own:
    // opened on the first search, closed with the document.
    var preV: PdfRendererPreV? = null
    var preVDescriptor: ParcelFileDescriptor? = null

    fun close() {
      images.forEach { it.delete() }
      images.clear()
      preV?.close()
      preVDescriptor?.close()
      renderer.close()
      descriptor.close()
    }
  }

  private val executor = Executors.newSingleThreadExecutor { Thread(it, "glowup-pdf") }
  private val worker = executor.asCoroutineDispatcher()
  private val documents = HashMap<String, Document>()

  override fun definition() = ModuleDefinition {
    Name("GlowupPdf")

    AsyncFunction("capabilities") {
      mapOf("search" to canSearch)
    }

    AsyncFunction("open") Coroutine { uri: String ->
      withContext(worker) { openDocument(uri) }
    }

    AsyncFunction("renderPage") Coroutine { uri: String, index: Int, width: Double ->
      withContext(worker) { renderImage(uri, index, width) }
    }

    // One page at a time: the one thread is never busy with a search for longer than a page, so a drawing
    // waits for that and not for the whole document (the viewer asks page by page and can stop between two).
    AsyncFunction("searchPage") Coroutine { uri: String, page: Int, query: String ->
      withContext(worker) { findText(uri, page, query) }
    }

    AsyncFunction("close") Coroutine { uri: String ->
      withContext(worker) { closeDocument(uri) }
    }

    OnDestroy {
      executor.execute { documents.keys.toList().forEach { closeDocument(it) } }
      executor.shutdown()
    }
  }

  private fun openDocument(uri: String): Map<String, Any> {
    val path = Uri.parse(uri).path ?: throw PdfFormatException()
    closeDocument(uri)

    val descriptor = try {
      ParcelFileDescriptor.open(File(path), ParcelFileDescriptor.MODE_READ_ONLY)
    } catch (error: IOException) {
      throw PdfFormatException(error)
    }
    val renderer = try {
      PdfRenderer(descriptor)
    } catch (error: SecurityException) {
      descriptor.close()
      throw PdfPasswordException(error)
    } catch (error: IOException) {
      descriptor.close()
      throw PdfFormatException(error)
    }
    if (renderer.pageCount == 0) {
      renderer.close()
      descriptor.close()
      throw PdfFormatException()
    }

    documents[uri] = Document(renderer, descriptor, File(path))
    val pages = (0 until renderer.pageCount).map { index ->
      renderer.openPage(index).use { page ->
        mapOf("width" to page.width.toDouble(), "height" to page.height.toDouble())
      }
    }
    return mapOf("pages" to pages)
  }

  private fun renderImage(uri: String, index: Int, width: Double): String {
    val document = documents[uri] ?: throw PdfNotOpenException()
    if (index < 0 || index >= document.renderer.pageCount) throw PdfPageException(index)

    // Never wider than a texture can be: 2400 is the most the viewer asks for.
    val pixels = width.toInt().coerceIn(1, 4096)
    val folder = File(
      (appContext.reactContext ?: throw Exceptions.ReactContextLost()).cacheDir,
      "glowup-pdf"
    ).apply { mkdirs() }
    val file = File(folder, "${uri.hashCode().toUInt()}-$index-$pixels.jpg")

    try {
      document.renderer.openPage(index).use { page ->
        val height = (pixels.toDouble() * page.height / page.width).toInt().coerceAtLeast(1)
        val bitmap = Bitmap.createBitmap(pixels, height, Bitmap.Config.ARGB_8888)
        try {
          // A PDF page is transparent where nothing is drawn: the viewer wants white paper.
          bitmap.eraseColor(Color.WHITE)
          page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
          FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.JPEG, 90, it) }
        } finally {
          bitmap.recycle()
        }
      }
    } catch (error: IOException) {
      throw PdfRenderException(error)
    } catch (error: OutOfMemoryError) {
      throw PdfRenderException(null)
    }
    if (!document.images.contains(file)) document.images.add(file)
    return Uri.fromFile(file).toString()
  }

  /**
   * The system's own text search, one page: `PdfRenderer.Page.searchText` from Android 15 (API 35), and
   * `PdfRendererPreV.Page.searchText` on Android 11 to 14 where the device has SDK extension 13.
   * Anything older finds nothing (`capabilities` says so, and the viewer hides the search).
   */
  private val canSearch: Boolean
    get() = Build.VERSION.SDK_INT >= 35 ||
      (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
        SdkExtensions.getExtensionVersion(Build.VERSION_CODES.S) >= 13)

  @SuppressLint("NewApi")
  private fun findText(uri: String, index: Int, query: String): List<Map<String, Any>> {
    val document = documents[uri] ?: throw PdfNotOpenException()
    if (index < 0 || index >= document.renderer.pageCount) throw PdfPageException(index)
    val text = query.trim()
    if (text.isEmpty() || !canSearch) return emptyList()

    val matches = mutableListOf<Map<String, Any>>()
    try {
      val renderer = if (Build.VERSION.SDK_INT >= 35) null else (document.preV ?: openPreV(document))
      if (renderer == null) {
        document.renderer.openPage(index).use { page ->
          addMatches(matches, page.searchText(text), index, page.width, page.height)
        }
      } else {
        renderer.openPage(index).use { page ->
          addMatches(matches, page.searchText(text), index, page.width, page.height)
        }
      }
    } catch (error: IOException) {
      throw PdfRenderException(error)
    }
    return matches
  }

  @SuppressLint("NewApi")
  private fun openPreV(document: Document): PdfRendererPreV {
    val descriptor = ParcelFileDescriptor.open(document.file, ParcelFileDescriptor.MODE_READ_ONLY)
    return try {
      PdfRendererPreV(descriptor).also {
        document.preV = it
        document.preVDescriptor = descriptor
      }
    } catch (error: Exception) {
      descriptor.close()
      throw PdfRenderException(error)
    }
  }

  /**
   * One match is a rectangle per line it covers, in points on the page (origin at the top left,
   * as the page is drawn); the viewer wants fractions (0..1) of the page.
   */
  @SuppressLint("NewApi")
  private fun addMatches(
    into: MutableList<Map<String, Any>>,
    found: List<PageMatchBounds>,
    page: Int,
    width: Int,
    height: Int,
  ) {
    if (width <= 0 || height <= 0) return
    for (match in found) {
      val rects = match.bounds.map {
        mapOf(
          "x" to it.left.toDouble() / width,
          "y" to it.top.toDouble() / height,
          "width" to it.width().toDouble() / width,
          "height" to it.height().toDouble() / height,
        )
      }
      if (rects.isNotEmpty()) into.add(mapOf("page" to page, "rects" to rects))
    }
  }

  private fun closeDocument(uri: String) {
    documents.remove(uri)?.close()
  }
}
