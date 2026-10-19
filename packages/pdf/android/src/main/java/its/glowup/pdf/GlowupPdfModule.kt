package its.glowup.pdf

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
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
  private class Document(val renderer: PdfRenderer, val descriptor: ParcelFileDescriptor) {
    val images = mutableListOf<File>()

    fun close() {
      images.forEach { it.delete() }
      images.clear()
      renderer.close()
      descriptor.close()
    }
  }

  private val executor = Executors.newSingleThreadExecutor { Thread(it, "glowup-pdf") }
  private val worker = executor.asCoroutineDispatcher()
  private val documents = HashMap<String, Document>()

  override fun definition() = ModuleDefinition {
    Name("GlowupPdf")

    // Search arrives with the system's own text search (plan step 6); until then it is off.
    AsyncFunction("capabilities") {
      mapOf("search" to false)
    }

    AsyncFunction("open") Coroutine { uri: String ->
      withContext(worker) { openDocument(uri) }
    }

    AsyncFunction("renderPage") Coroutine { uri: String, index: Int, width: Double ->
      withContext(worker) { renderImage(uri, index, width) }
    }

    AsyncFunction("search") Coroutine { uri: String, _: String ->
      withContext(worker) {
        if (!documents.containsKey(uri)) throw PdfNotOpenException()
        emptyList<Map<String, Any>>()
      }
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

    documents[uri] = Document(renderer, descriptor)
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

  private fun closeDocument(uri: String) {
    documents.remove(uri)?.close()
  }
}
