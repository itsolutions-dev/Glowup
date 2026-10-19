import ExpoModulesCore

// The JavaScript side tells these apart by the words "password" and "format" in the code or the
// message (`fromNativeError` in src/adapters.ts): keep them in the reasons.

internal final class PdfFormatException: Exception {
  override var reason: String {
    "The file is not a PDF this device can read (invalid format)"
  }
}

internal final class PdfPasswordException: Exception {
  override var reason: String {
    "The PDF is protected by a password"
  }
}

internal final class PdfNotOpenException: Exception {
  override var reason: String {
    "The document is not open: call open() first"
  }
}

internal final class PdfPageException: GenericException<Int> {
  override var reason: String {
    "The document has no page \(param)"
  }
}

internal final class PdfRenderException: Exception {
  override var reason: String {
    "The page could not be drawn"
  }
}
