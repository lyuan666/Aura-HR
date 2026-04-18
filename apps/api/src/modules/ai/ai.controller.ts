import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

interface GreetingDto {
  candidate: { name: string };
  job: { title: string };
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-resume')
  parseResume(@Body('text') text: string) {
    return this.aiService.parseResume(text);
  }

  @Post('greeting')
  generateGreeting(@Body() body: any) {
    // 适配前端可能传递的不同结构
    const resumeText = body.candidate?.resumeText || body.resumeText || '';
    const jobTitle = body.job?.title || '目标职位';
    const jobDesc = body.job?.description || '';
    
    return this.aiService.generateOutreachMessage(resumeText, jobTitle, jobDesc);
  }
}
