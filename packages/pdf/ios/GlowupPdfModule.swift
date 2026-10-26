import ExpoModulesCore
import PDFKit
import UIKit

/// PDFKit behind the functions of `PdfNative` (src/types.ts). Documents stay open between
/// calls, keyed by their file URI, until `close`.
public final class GlowupPdfModule: Module {
  // One queue for everything: PDFKit objects are not meant to be used from several threads at
  // once, and it keeps `documents` and `images` free of locks.
  private let queue = DispatchQueue(label: "its.glowup.pdf")
  private var documents: [String: PDFDocument] = [:]
  private var images: [String: [URL]] = [:]

  public func definition() -> ModuleDefinition {
    Name("GlowupPdf")

    AsyncFunction("capabilities") { () -> [String: Any] in
      ["search": true]
    }

    AsyncFunction("open") { (uri: String) -> [String: Any] in
      try self.openDocument(uri)
    }
    .runOnQueue(queue)

    AsyncFunction("renderPage") { (uri: String, index: Int, width: Double) -> String in
      try self.renderImage(uri, index: index, width: width)
    }
    .runOnQueue(queue)

    // One page at a time (see the Android module): the queue is never busy with a search for longer than a page.
    AsyncFunction("searchPage") { (uri: String, index: Int, query: String) -> [[String: Any]] in
      try self.findText(uri, index: index, query: query)
    }
    .runOnQueue(queue)

    AsyncFunction("close") { (uri: String) in
      self.closeDocument(uri)
    }
    .runOnQueue(queue)

    OnDestroy {
      self.queue.async {
        for uri in Array(self.documents.keys) { self.closeDocument(uri) }
      }
    }
  }

  // MARK: - Functions

  private func openDocument(_ uri: String) throws -> [String: Any] {
    guard let url = URL(string: uri), url.isFileURL, let document = PDFDocument(url: url) else {
      throw PdfFormatException()
    }
    if document.isLocked { throw PdfPasswordException() }
    if document.pageCount == 0 { throw PdfFormatException() }
    closeDocument(uri)
    documents[uri] = document

    var pages: [[String: Any]] = []
    for index in 0..<document.pageCount {
      let size = document.page(at: index).map(displaySize) ?? .zero
      pages.append(["width": Double(size.width), "height": Double(size.height)])
    }
    return ["pages": pages]
  }

  private func renderImage(_ uri: String, index: Int, width: Double) throws -> String {
    let page = try page(uri, index)
    guard let reference = page.pageRef else { throw PdfRenderException() }

    // Never wider than a texture can be: 2400 is the most the viewer asks for.
    let pixels = min(max(width.rounded(), 1), 4096)
    let natural = displaySize(page)
    guard natural.width > 0 else { throw PdfRenderException() }
    let target = CGSize(width: pixels, height: (pixels * natural.height / natural.width).rounded())

    // Scale 1: the viewer asks for pixels, not points.
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    format.opaque = true
    let image = UIGraphicsImageRenderer(size: target, format: format).image { context in
      UIColor.white.setFill()
      context.fill(CGRect(origin: .zero, size: target))
      let cg = context.cgContext
      cg.interpolationQuality = .high
      // UIKit's origin is the top left and a PDF's the bottom left, and the page is drawn in points:
      // scale from points to pixels by hand. `getDrawingTransform` only ever scales a page down to fit
      // its rectangle, never up: given the target it drew a 595-point page at 595 pixels, small and in
      // the middle, on every phone wider than that (seen in the CI screenshot of 2026-10-21). Given the
      // page's own size it scales by 1 and only places the crop box and applies the page's rotation.
      let scale = target.width / natural.width
      cg.translateBy(x: 0, y: target.height)
      cg.scaleBy(x: scale, y: -scale)
      cg.concatenate(
        reference.getDrawingTransform(.cropBox, rect: CGRect(origin: .zero, size: natural), rotate: 0, preserveAspectRatio: true)
      )
      cg.drawPDFPage(reference)
    }

    guard let data = image.jpegData(compressionQuality: 0.9) else { throw PdfRenderException() }
    let folder = FileManager.default.temporaryDirectory.appendingPathComponent("glowup-pdf", isDirectory: true)
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    let file = folder.appendingPathComponent("\(abs(uri.hashValue))-\(index)-\(Int(pixels)).jpg")
    try data.write(to: file, options: .atomic)
    if !(images[uri]?.contains(file) ?? false) { images[uri, default: []].append(file) }
    return file.absoluteString
  }

  private func findText(_ uri: String, index: Int, query: String) throws -> [[String: Any]] {
    let page = try page(uri, index)
    let text = query.trimmingCharacters(in: .whitespacesAndNewlines)
    if text.isEmpty { return [] }

    // PDFKit searches a whole document, not a page: the page's text is searched here, ignoring case and accents as
    // `findString` did, and each hit is turned into a selection to get its rectangles.
    let content = (page.string ?? "") as NSString
    var matches: [[String: Any]] = []
    var from = 0
    while from < content.length {
      let found = content.range(
        of: text,
        options: [.caseInsensitive, .diacriticInsensitive],
        range: NSRange(location: from, length: content.length - from)
      )
      if found.location == NSNotFound || found.length == 0 { break }
      from = found.location + found.length
      guard let selection = page.selection(for: found) else { continue }
      // A hit that wraps over lines is one rectangle per line.
      var rects: [[String: Double]] = []
      for line in selection.selectionsByLine() {
        if let rect = fraction(line.bounds(for: page), on: page) { rects.append(rect) }
      }
      if !rects.isEmpty { matches.append(["page": index, "rects": rects]) }
    }
    return matches
  }

  private func closeDocument(_ uri: String) {
    documents[uri] = nil
    for file in images.removeValue(forKey: uri) ?? [] { try? FileManager.default.removeItem(at: file) }
  }

  // MARK: - Helpers

  private func page(_ uri: String, _ index: Int) throws -> PDFPage {
    guard let document = documents[uri] else { throw PdfNotOpenException() }
    guard index >= 0, index < document.pageCount, let page = document.page(at: index) else {
      throw PdfPageException(index)
    }
    return page
  }

  /// The page as it is shown: the crop box, width and height swapped for a page turned 90 or 270 degrees.
  private func displaySize(_ page: PDFPage) -> CGSize {
    let box = page.bounds(for: .cropBox)
    let turn = ((page.rotation % 360) + 360) % 360
    return turn == 90 || turn == 270 ? CGSize(width: box.height, height: box.width) : box.size
  }

  /// A rectangle in the page's own space as fractions (0..1) of the shown page, origin at the top left.
  private func fraction(_ rect: CGRect, on page: PDFPage) -> [String: Double]? {
    guard let reference = page.pageRef else { return nil }
    // The unit square stands for the shown page, so the transform's output is already a fraction
    // (with the y axis pointing up).
    let unit = reference.getDrawingTransform(
      .cropBox, rect: CGRect(x: 0, y: 0, width: 1, height: 1), rotate: 0, preserveAspectRatio: false
    )
    let shown = rect.applying(unit)
    return [
      "x": Double(shown.minX),
      "y": Double(1 - shown.maxY),
      "width": Double(shown.width),
      "height": Double(shown.height),
    ]
  }
}
