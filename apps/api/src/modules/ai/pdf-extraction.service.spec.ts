import { PdfExtractionService } from './pdf-extraction.service';

describe('PdfExtractionService', () => {
  let service: PdfExtractionService;

  beforeEach(() => {
    service = new PdfExtractionService();
    (service as any).mineruCircuitOpen = true;
    (service as any).mineruCircuitResetAt = Date.now() + 60000;
    delete process.env.ODL_URL;
    delete process.env.MINERU_URL;
  });

  it('does not treat image-only markdown as extracted resume text', () => {
    expect((service as any).hasEnoughExtractedText('![image 1](resume.png)\n\n')).toBe(false);
  });

  it('falls back to OCR when PDF text extraction only finds page markers', async () => {
    jest.spyOn(service as any, 'extractWithPdfParse').mockResolvedValue('\n\n-- 1 of 1 --\n\n');
    jest.spyOn(service as any, 'extractWithMacVisionOcr').mockResolvedValue(
      '张三 13800000000 上海 高级产品经理 复旦大学 本科 10年工作经验',
    );

    await expect(service.extractStructuredText(Buffer.from('%PDF'), 'scan.pdf')).resolves.toEqual({
      text: '张三 13800000000 上海 高级产品经理 复旦大学 本科 10年工作经验',
      format: 'plain',
      method: 'ocr',
    });
  });
});
