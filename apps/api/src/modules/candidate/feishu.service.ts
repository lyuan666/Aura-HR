import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FeishuService {
  private readonly logger = new Logger(FeishuService.name);

  /**
   * 从飞书多维表格读取候选人数据
   */
  async importFromBitable(appToken: string, tableId: string, personalToken: string) {
    this.logger.log(`开始从飞书多维表格导入数据: ${appToken}/${tableId}`);
    try {
      const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${personalToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 100 // 每次拉取 100 条
        }
      });

      if (response.data.code !== 0) {
        throw new Error(`飞书接口错误: ${response.data.msg}`);
      }

      const records = response.data.data.items || [];
      this.logger.log(`成功获取飞书数据，共 ${records.length} 条记录`);
      
      // 映射并清洗数据，以便后续走 AiService 或者直接存入数据库
      const candidates = records.map((record: any) => {
        const fields = record.fields || {};
        return {
          id: record.record_id,
          name: fields['姓名'] || fields['Name'] || '未知姓名',
          phone: fields['电话'] || fields['手机'] || fields['Phone'] || '',
          email: fields['邮箱'] || fields['Email'] || '',
          gender: fields['性别'] || fields['Gender'] || '',
          currentCompany: fields['当前公司'] || fields['公司'] || fields['Company'] || '',
          currentTitle: fields['当前职位'] || fields['职位'] || fields['Title'] || '',
          rawFeishuData: fields // 保留原始数据
        };
      });

      return {
        success: true,
        total: candidates.length,
        items: candidates
      };

    } catch (error: any) {
      this.logger.error(`飞书导入失败: ${error.message}`);
      if (error.response) {
        this.logger.error(`飞书错误响应: ${JSON.stringify(error.response.data)}`);
        throw new HttpException(
          `飞书授权失败或参数错误: ${error.response.data.msg || error.message}`, 
          HttpStatus.BAD_REQUEST
        );
      }
      throw new HttpException('飞书导入异常', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
