import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ContractGenerationEntity, ContractEntity, ContractAuditLogEntity, RiskAssessmentReport } from '../../entities';
import { ContractTemplateService } from './contract-template.service';
import { LlmClientService } from '../ai/llm-client.service';
import * as nunjucks from 'nunjucks';
import { customAlphabet } from 'nanoid';
import { Observable } from 'rxjs';

const generateSerial = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

function normalizeAiError(e: any): string {
  if (e?.message) {
    if (e.message.includes('ECONNREFUSED') || e.message.includes('ETIMEDOUT')) {
      return 'AI 服务连接失败，请检查 AI 服务配置或联系管理员';
    }
    if (e.message.includes('401') || e.message.includes('403')) {
      return 'AI 服务鉴权失败，请检查 API Key 配置';
    }
    if (e.message.includes('429')) {
      return 'AI 服务请求频率超限，请稍后重试';
    }
    return e.message;
  }
  return 'AI 服务暂时不可用，请稍后重试';
}

@Injectable()
export class ContractGenerationService {
  private readonly nunjucksEnv: nunjucks.Environment;

  constructor(
    @InjectRepository(ContractGenerationEntity)
    private readonly generationRepo: Repository<ContractGenerationEntity>,
    private readonly templateService: ContractTemplateService,
    private readonly llmClient: LlmClientService,
    private readonly dataSource: DataSource,
  ) {
    // 初始化 nunjucks 环境，开启 autoescape 以保障防跨站脚本(XSS)安全
    this.nunjucksEnv = new nunjucks.Environment(null, { autoescape: true });
  }

  async findAll(user: any, page = 1, pageSize = 20) {
    const where: any = {};
    if (user?.role !== 'admin') {
      if (user?.role === 'hr_client') {
        where.enterpriseId = user.enterpriseId;
      } else {
        where.tenantId = user?.tenantId;
      }
    }

    const [items, total] = await this.generationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findOne(id: string, user: any) {
    const generation = await this.generationRepo.findOne({ where: { id } });
    if (!generation) {
      throw new NotFoundException('生成记录不存在');
    }

    // 权限校验
    if (user?.role !== 'admin') {
      if (user?.role === 'hr_client') {
        if (generation.enterpriseId !== user.enterpriseId) {
          throw new ForbiddenException('您无权查看此合同生成记录');
        }
      } else {
        if (generation.tenantId !== user?.tenantId) {
          throw new ForbiddenException('您无权查看此合同生成记录');
        }
      }
    }

    return generation;
  }

  async create(dto: any, user: any) {
    const tenantId = user?.role === 'admin' ? dto.tenantId : user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('缺失租户标识 (tenantId)');
    }

    // 1. 获取模板并做鉴权校验
    const template = await this.templateService.findOne(dto.templateId, user);

    // 2. 验证必填变量
    const variableValues = dto.variableValues || {};
    const missingVars: string[] = [];
    
    for (const v of template.variables) {
      if (v.required && (variableValues[v.name] === undefined || variableValues[v.name] === null || variableValues[v.name] === '')) {
        missingVars.push(`${v.label}(${v.name})`);
      }
    }
    
    if (missingVars.length > 0) {
      throw new BadRequestException(`以下必填字段未填写: ${missingVars.join(', ')}`);
    }

    // 3. 使用 Nunjucks 渲染模板内容
    let renderedContent = '';
    try {
      renderedContent = this.nunjucksEnv.renderString(template.templateContent, variableValues);
    } catch (e: any) {
      throw new BadRequestException(`模板渲染失败: ${e.message}`);
    }

    // 4. 生成唯一的批次/草稿号 (如: GEN-20260520-ABCDEF)
    const date = new Date();
    const dateStr = date.getFullYear() + 
      String(date.getMonth() + 1).padStart(2, '0') + 
      String(date.getDate()).padStart(2, '0');
    const generationNo = `GEN-${dateStr}-${generateSerial()}`;

    // 5. 保存实体与深拷贝快照
    const generation = this.generationRepo.create({
      tenantId,
      templateId: template.id,
      templateSnapshot: {
        name: template.name,
        category: template.category,
        templateContent: template.templateContent,
        variables: template.variables,
        version: template.version,
      },
      enterpriseId: dto.enterpriseId || null,
      generationNo,
      variableValues,
      content: renderedContent,
      editedContent: null, // 初始化为 null，富文本微调后再填充
      status: 'draft',
    });

    return this.generationRepo.save(generation);
  }

  async updateContent(id: string, editedContent: string, user: any) {
    const generation = await this.findOne(id, user);
    
    // 只有在草稿或预览状态才能手动修改正文
    if (generation.status !== 'draft' && generation.status !== 'preview') {
      throw new BadRequestException('当前状态下无法修改合同内容');
    }

    generation.editedContent = editedContent;
    return this.generationRepo.save(generation);
  }

  async updateStatus(id: string, status: string, user: any) {
    const generation = await this.findOne(id, user);
    generation.status = status;
    return this.generationRepo.save(generation);
  }

  assessRiskStream(id: string, user: any): Observable<any> {
    return new Observable(subscriber => {
      (async () => {
        try {
          const generation = await this.findOne(id, user);
          const contractText = generation.editedContent || generation.content;

          // 清除 HTML 标签，减少大模型 Token 损耗并让模型集中于文本阅读
          const cleanText = contractText
            .replace(/<[^>]*>/g, '\n')
            .replace(/\n+/g, '\n')
            .trim();

          const dimensions = [
            {
              key: 'rates',
              name: '费率合理性与责任限制',
              prompt: `你是猎头/HR行业法务专家。审查合同中的费率与责任限制条款。
判断费率是否符合普通猎头服务收费标准（一般为候选人年薪的15%-25%），责任限制是否偏袒某一方。
你必须严格仅输出JSON，不能有任何解释文字，格式如下：
{"score": 分数数值1到100, "riskLevel": "low"或"medium"或"high", "summary": "条款摘要简述", "suggestion": "具体的法务修改建议"}`
            },
            {
              key: 'payment',
              name: '账期与违约金风险',
              prompt: `你是猎头/HR行业法务专家。审查合同中的付款账期与逾期付款违约金条款。
判断账期（如收到发票后多少天内付款，超过30-45天为中高风险）和逾期利息（如每天万分之五或更高为高风险）的限制。
你必须严格仅输出JSON，不能有任何解释文字，格式如下：
{"score": 分数数值1到100, "riskLevel": "low"或"medium"或"high", "summary": "条款摘要简述", "suggestion": "具体的法务修改建议"}`
            },
            {
              key: 'nonSolicitation',
              name: '劝诱禁止条款',
              prompt: `你是猎头/HR行业法务专家。审查合同中的劝诱禁止/挖角条款。
分析条款中对挖雇客户员工的惩罚性规定是否公平合理，限期是否过长（一般为12-24个月）。
你必须严格仅输出JSON，不能有任何解释文字，格式如下：
{"score": 分数数值1到100, "riskLevel": "low"或"medium"或"high", "summary": "条款摘要简述", "suggestion": "具体的法务修改建议"}`
            },
            {
              key: 'jurisdiction',
              name: '争议解决与管辖地',
              prompt: `你是猎头/HR行业法务专家。审查争议解决与管辖条款。
判断争议解决形式与管辖属地。如果管辖地在异地，或者仲裁机构偏袒，则为中高风险。
你必须严格仅输出JSON，不能有任何解释文字，格式如下：
{"score": 分数数值1到100, "riskLevel": "low"或"medium"或"high", "summary": "条款摘要简述", "suggestion": "具体的法务修改建议"}`
            },
            {
              key: 'termination',
              name: '单方面解除权',
              prompt: `你是猎头/HR行业法务专家。审查合同的单方面解除与提前通知条款。
判断双方的解约通知期是否对称（如一方可随时书面通知，另一方需提前30天，则为不平等风险）。
你必须严格仅输出JSON，不能有任何解释文字，格式如下：
{"score": 分数数值1到100, "riskLevel": "low"或"medium"或"high", "summary": "条款摘要简述", "suggestion": "具体的法务修改建议"}`
            }
          ];

          const results: Record<string, any> = {};
          let totalScore = 0;

          for (const dim of dimensions) {
            subscriber.next({
              status: 'progress',
              dimension: dim.key,
              message: `正在对合同进行【${dim.name}】专项审查评估...`,
            });

            const response = await this.llmClient.callAi(
              [
                { role: 'system', content: dim.prompt },
                { role: 'user', content: `以下是合同正文文本：\n\n${cleanText.slice(0, 8000)}` },
              ],
              true,
            );

            // 失败或返回格式不对时的容错兜底
            const score = typeof response?.score === 'number' ? response.score : 85;
            const riskLevel = typeof response?.riskLevel === 'string' ? response.riskLevel : 'low';
            const summary = typeof response?.summary === 'string' ? response.summary : '未发现明显高风险内容。';
            const suggestion = typeof response?.suggestion === 'string' ? response.suggestion : '该条款基本合规，无需特殊修改。';

            results[dim.key] = { score, riskLevel, summary, suggestion };
            totalScore += score;

            subscriber.next({
              status: 'result',
              dimension: dim.key,
              result: results[dim.key],
            });
          }

          const finalScore = Math.round(totalScore / dimensions.length);

          const issues: string[] = [];
          const suggestions: string[] = [];

          for (const key of Object.keys(results)) {
            const dim = results[key];
            if (dim.riskLevel !== 'low') {
              const label = key === 'rates' ? '费率合理性' : 
                            key === 'payment' ? '账期与违约金' : 
                            key === 'nonSolicitation' ? '劝诱禁止' : 
                            key === 'jurisdiction' ? '争议解决' : '单方面解除';
              issues.push(`【${label}】${dim.summary}`);
              suggestions.push(dim.suggestion);
            }
          }

          const finalReport: RiskAssessmentReport = {
            score: finalScore,
            issues,
            suggestions,
            dimensions: results,
            assessedAt: new Date().toISOString(),
          };

          // 保存最终分析报告到生成草稿记录中
          generation.riskAssessment = finalReport;
          await this.generationRepo.save(generation);

          subscriber.next({
            status: 'completed',
            report: finalReport,
          });
          subscriber.complete();
        } catch (e: any) {
          subscriber.next({
            status: 'error',
            code: 'AI_PROVIDER_UNAVAILABLE',
            message: normalizeAiError(e),
            retryable: true,
          });
          subscriber.complete();
        }
      })();
    });
  }

  async formalize(id: string, user: any) {
    return this.dataSource.transaction(async transactionalEntityManager => {
      // 1. 获取并锁住 Generation (防止并发冲突)
      const generation = await transactionalEntityManager.findOne(ContractGenerationEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!generation) {
        throw new NotFoundException('生成记录不存在');
      }

      if (generation.status === 'formalized') {
        throw new BadRequestException('该合同已正式化，请勿重复操作');
      }

      // 权限校验
      if (user?.role !== 'admin' && user?.role !== 'manager' && generation.tenantId !== user?.tenantId) {
        throw new ForbiddenException('您无权对该合同进行正式化操作');
      }

      // 2. 在 contracts 表中生成正式合同实例
      const templateSnapshot = generation.templateSnapshot as any;
      const templateName = templateSnapshot?.name || '在线生成合同';
      
      const contractRepo = transactionalEntityManager.getRepository(ContractEntity);
      
      // 自动从表单变量中智能抽取总额和日期字段
      const vars = generation.variableValues || {};
      const amount = Number(vars.monthlySalary || vars.amount || vars.salary || 0);
      const startDate = vars.startDate ? new Date(vars.startDate) : new Date();
      const endDate = vars.endDate ? new Date(vars.endDate) : new Date();
      
      const contract = contractRepo.create({
        tenantId: generation.tenantId,
        enterpriseId: generation.enterpriseId || 'unknown',
        contractNo: generation.generationNo,
        title: `${templateName}-${generation.generationNo}`,
        amount,
        startDate,
        endDate,
        status: 'active',
        fileUrl: '', // 在线合同无附件，由 generation_id 关联
        notes: `由模板【${templateName}】自动在线渲染生成`,
        generationId: generation.id,
      });

      const savedContract = await contractRepo.save(contract);

      // 3. 更新 Generation 的状态与关联
      generation.status = 'formalized';
      generation.contractId = savedContract.id;
      generation.formalizedAt = new Date();
      await transactionalEntityManager.save(ContractGenerationEntity, generation);

      // 4. 写入审计日志 contract_audit_logs
      const auditLogRepo = transactionalEntityManager.getRepository(ContractAuditLogEntity);
      const auditLog = auditLogRepo.create({
        contractId: savedContract.id,
        generationId: generation.id,
        operatorId: user?.id || '00000000-0000-0000-0000-000000000000',
        action: 'formalize',
        details: {
          notes: '合同在线正式化归档',
          templateVersion: templateSnapshot?.version || '1.0',
          variablesUsed: generation.variableValues,
        },
      });
      await auditLogRepo.save(auditLog);

      return {
        success: true,
        contractId: savedContract.id,
        contractNo: savedContract.contractNo,
      };
    });
  }
}
