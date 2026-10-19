import ExpoModulesCore
import PDFKit
import UIKit

/// PDFKit behind the five functions of `PdfNative` (src/types.ts). Documents stay open between
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

    AsyncFunction("search") { (uri: String, query: String) -> [[String: Any]] in
      try self.findText(uri, query: query)
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
      // UIKit's origin is the top left and a PDF's the bottom left. The drawing transform then
      // places the crop box in the target and applies the page's own rotation.
      cg.translateBy(x: 0, y: target.height)
      cg.scaleBy(x: 1, y: -1)
      cg.concatenate(
        reference.getDrawingTransform(.cropBox, rect: CGRect(origin: .zero, size: target), rotate: 0, preserveAspectRatio: true)
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

  private func findText(_ uri: String, query: String) throws -> [[String: Any]] {
    guard let document = documents[uri] else { throw PdfNotOpenException() }
    let text = query.trimmingCharacters(in: .whitespacesAndNewlines)
    if text.isEmpty { return [] }

    var matches: [[String: Any]] = []
    for selection in document.findString(text, withOptions: [.caseInsensitive, .diacriticInsensitive]) {
      // A hit that wraps over lines is one rectangle per line; one that crosses a page is one match per page.
      var rectsByPage: [(page: Int, rects: [[String: Double]])] = []
      for line in selection.selectionsByLine() {
        for page in line.pages {
          let index = document.index(for: page)
          guard index != NSNotFound, let rect = fraction(line.bounds(for: page), on: page) else { continue }
          if let slot = rectsByPage.firstIndex(where: { $0.page == index }) {
            rectsByPage[slot].rects.append(rect)
          } else {
            rectsByPage.append((page: index, rects: [rect]))
          }
        }
      }
      for entry in rectsByPage { matches.append(["page": entry.page, "rects": entry.rects]) }
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
