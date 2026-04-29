import { TDocumentDefinitions } from 'pdfmake/interfaces';

export const generateRecommendationPdfDefinition = (data: {
  candidate: any;
  job: any;
  analysis: any;
}): TDocumentDefinitions => {
  return {
    content: [
      { text: '候选人推荐报告', style: 'header', alignment: 'center' },
      { text: `生成日期: ${new Date().toLocaleDateString('zh-CN')}`, alignment: 'right', margin: [0, 0, 0, 20] },

      { text: '一、基本信息', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: `姓名: ${data.candidate.name}`, margin: [0, 5] },
              { text: `应聘职位: ${data.job.title}`, margin: [0, 5] },
            ],
            [
              { text: `工作年限: ${data.candidate.totalYears || 'N/A'} 年`, margin: [0, 5] },
              { text: `当前公司: ${data.candidate.currentCompany || 'N/A'}`, margin: [0, 5] },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },

      { text: '二、AI 匹配度评分', style: 'sectionHeader' },
      {
        columns: [
          {
            width: 'auto',
            text: `${data.analysis?.score || 0}`,
            style: 'scoreBig',
          },
          {
            width: '*',
            text: data.analysis?.reason || '暂无匹配理由',
            margin: [20, 10, 0, 0],
          },
        ],
      },

      { text: '三、优势与亮点', style: 'sectionHeader' },
      {
        ul: data.analysis?.highlights || ['具备相关行业背景', '核心技能匹配度高'],
      },

      { text: '四、风险提示', style: 'sectionHeader' },
      {
        ul: data.analysis?.risks || ['期望薪资略高于预算', '通勤距离较远'],
        color: '#e74c3c',
      },

      {
        text: '--- 内部资料，请勿外传 ---',
        style: 'footer',
        alignment: 'center',
        margin: [0, 50, 0, 0],
      },
    ],
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        margin: [0, 20, 0, 10],
        color: '#2c3e50',
      },
      scoreBig: {
        fontSize: 40,
        bold: true,
        color: '#27ae60',
      },
      footer: {
        fontSize: 10,
        color: '#bdc3c7',
      },
    },
    defaultStyle: {
      font: 'Roboto', // 默认使用 Roboto，稍后在 Service 中配置中文字体
    },
  };
};
