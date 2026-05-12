import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { FeishuService } from '../candidate/feishu.service';
import { EnterpriseService } from '../enterprise/enterprise.service';
import { AiService } from '../ai/ai.service';

@Processor('feishu-import')
@Injectable()
export class FeishuImportProcessor extends WorkerHost {
  private readonly logger = new Logger(FeishuImportProcessor.name);

  constructor(
    private readonly feishuService: FeishuService,
    private readonly enterpriseService: EnterpriseService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { type, enterpriseId, rawName, tenantId } = job.data;

    if (type === 'enrich') {
      return this.enrichEnterprise(enterpriseId, rawName, tenantId);
    }
    
    return { success: false, message: '未知的任务类型' };
  }

  private async enrichEnterprise(enterpriseId: string, rawName: string, tenantId: string) {
    this.logger.log(`开始 AI 深度补全企业信息: ${rawName} (${enterpriseId})`);
    
    try {
      const enterprise = await this.enterpriseService.findOne(enterpriseId, tenantId);
      if (!enterprise) return;

      // 1. AI 规范化名称并去重/合并（如果发现名称变了且指向已存在的企业）
      let normalizedName = rawName;
      try {
        normalizedName = await this.aiService.normalizeEnterpriseName(rawName);
        if (normalizedName !== rawName) {
          // 如果规范化后的名称已经存在其他记录中，这里可以考虑合并，但目前简化为仅更新当前记录名称
          await this.enterpriseService['entRepo'].update(enterpriseId, { name: normalizedName });
        }
      } catch (e) {
        this.logger.error(`AI 规范化名称失败: ${rawName}`, e);
      }

      // 2. AI 自动补充缺失信息
      if (!enterprise.industry || !enterprise.scale || !enterprise.description || !enterprise.website) {
        try {
          const enriched = await this.aiService.enrichEnterpriseInfo(normalizedName, {
            industry: enterprise.industry,
            scale: enterprise.scale,
            description: enterprise.description,
            website: enterprise.website,
          });

          if (enriched) {
            await this.enterpriseService['entRepo'].update(enterpriseId, {
              industry: enterprise.industry || enriched.industry,
              scale: enterprise.scale || enriched.scale,
              description: enterprise.description || enriched.description,
              website: enterprise.website || enriched.website,
            });
          }
        } catch (e) {
          this.logger.error(`AI 补充信息失败: ${normalizedName}`, e);
        }
      }

      return { success: true };
    } catch (err) {
      this.logger.error(`处理企业增强任务失败: ${enterpriseId}`, err);
      throw err;
    }
  }
}
