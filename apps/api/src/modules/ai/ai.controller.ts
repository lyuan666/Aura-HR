import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-resume')
  parseResume(@Body('text') text: string) {
    if (!text || text.trim().length < 20) {
      throw new BadRequestException('简历文本不能为空，且至少需要 20 个字符');
    }
    return this.aiService.parseResume(text);
  }

  @Post('greeting')
  generateGreeting(@Body() body: any) {
    // 适配前端可能传递的不同结构
    const resumeText = body?.candidate?.resumeText || body?.resumeText || '';
    const jobTitle = body?.job?.title || body?.jobTitle || '';
    const jobDesc = body?.job?.description || body?.jobDescription || '';

    if (!resumeText || resumeText.trim().length < 20) {
      throw new BadRequestException(
        'resumeText 不能为空，且至少需要 20 个字符',
      );
    }
    if (!jobTitle || jobTitle.trim().length < 2) {
      throw new BadRequestException('jobTitle 不能为空');
    }
    if (!jobDesc || jobDesc.trim().length < 20) {
      throw new BadRequestException(
        'jobDescription 不能为空，且至少需要 20 个字符',
      );
    }

    return this.aiService.generateOutreachMessage(
      resumeText,
      jobTitle,
      jobDesc,
    );
  }
}
