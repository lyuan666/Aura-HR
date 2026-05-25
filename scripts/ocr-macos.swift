import AppKit
import Foundation
import PDFKit
import Vision

func fail(_ message: String, code: Int32 = 1) -> Never {
  FileHandle.standardError.write(Data((message + "\n").utf8))
  exit(code)
}

guard CommandLine.arguments.count >= 2 else {
  fail("Usage: swift scripts/ocr-macos.swift <pdf-path> [max-pages]")
}

let pdfURL = URL(fileURLWithPath: CommandLine.arguments[1])
let maxPages = CommandLine.arguments.count >= 3 ? (Int(CommandLine.arguments[2]) ?? 3) : 3

guard let document = PDFDocument(url: pdfURL) else {
  fail("Unable to open PDF: \(pdfURL.path)", code: 2)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]

let pageCount = min(document.pageCount, maxPages)
var output: [String] = []

for index in 0..<pageCount {
  guard let page = document.page(at: index) else { continue }

  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 2.5
  let image = NSImage(size: NSSize(width: bounds.width * scale, height: bounds.height * scale))

  image.lockFocus()
  guard let graphicsContext = NSGraphicsContext.current else {
    image.unlockFocus()
    continue
  }
  graphicsContext.imageInterpolation = .high
  let context = graphicsContext.cgContext
  NSColor.white.set()
  context.fill(CGRect(origin: .zero, size: image.size))
  context.saveGState()
  context.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: context)
  context.restoreGState()
  image.unlockFocus()

  guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let cgImage = bitmap.cgImage
  else {
    continue
  }

  let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
  do {
    try handler.perform([request])
    let lines = request.results?.compactMap { observation in
      observation.topCandidates(1).first?.string
    } ?? []
    output.append(lines.joined(separator: "\n"))
  } catch {
    fail("Vision OCR failed on page \(index + 1): \(error.localizedDescription)", code: 3)
  }
}

print(output.joined(separator: "\n"))
