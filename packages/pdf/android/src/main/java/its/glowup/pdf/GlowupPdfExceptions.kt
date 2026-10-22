package its.glowup.pdf

import expo.modules.kotlin.exception.CodedException

// The JavaScript side tells these apart by the words "password" and "format" in the code or the
// message (`fromNativeError` in src/adapters.ts): keep them in the messages.

internal class PdfFormatException(cause: Throwable? = null) :
  CodedException("The file is not a PDF this device can read (invalid format)", cause)

internal class PdfPasswordException(cause: Throwable? = null) :
  CodedException("The PDF is protected by a password", cause)

internal class PdfNotOpenException :
  CodedException("The document is not open: call open() first")

internal class PdfPageException(index: Int) :
  CodedException("The document has no page $index")

internal class PdfRenderException(cause: Throwable? = null) :
  CodedException("The page could not be drawn", cause)

internal class PdfSaveException(cause: Throwable? = null) :
  CodedException("The file could not be saved to Downloads", cause)
