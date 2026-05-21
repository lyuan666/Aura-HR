-- Seed Contract Templates
-- Run manually:
--   docker exec -i yzschros-postgres psql -U yzschros -d yzschros < apps/api/src/migrations/008-seed-templates.sql

-- Clear any existing default templates to avoid duplicates if re-run
DELETE FROM contract_templates WHERE tenant_id IS NULL;

-- 1. Insert Standard Labor Contract Template
INSERT INTO contract_templates (
  id,
  tenant_id,
  name,
  category,
  description,
  template_content,
  file_url,
  variables,
  status,
  version,
  parent_id,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  NULL, -- System preset
  '标准劳动合同模板',
  'labor',
  '包含劳动法基本规定、劳动岗位、报酬等条款，适用于普通全职员工签订。',
  '<div style="font-family: SimSun, serif; padding: 20px; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto;">
  <h1 style="text-align: center; font-size: 26px; margin-bottom: 30px;">劳 动 合 同 书</h1>
  <p style="text-indent: 2em; margin-bottom: 20px;">根据《中华人民共和国劳动法》、《中华人民共和国劳动合同法》及有关法律、法规，甲乙双方在平等自愿、协商一致的基础上，同意订立本合同，共同遵守本合同所列条款。</p>
  
  <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
    <tr>
      <td style="width: 150px; font-weight: bold; padding: 8px 0;">甲方（用人单位）：</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #333;">{{ employerName }}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 8px 0;">统一社会信用代码：</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #333;">{{ employerCode }}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 8px 0;">乙方（劳动者）：</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #333;">{{ employeeName }}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 8px 0;">身份证号码：</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #333;">{{ employeeIdNo }}</td>
    </tr>
  </table>
  
  <h2 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px;">第一条 合同期限与工作岗位</h2>
  <p>1. 本合同为有固定期限劳动合同，自 <strong>{{ startDate }}</strong> 起至 <strong>{{ endDate }}</strong> 止。</p>
  <p>2. 乙方同意在甲方担任 <strong>{{ jobTitle }}</strong> 岗位工作。乙方的工作地点为 <strong>{{ workLocation }}</strong>。</p>

  <h2 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px;">第二条 劳动报酬</h2>
  <p>1. 乙方的月基本工资为人民币 <strong>{{ monthlySalary }}</strong> 元，于每月 15 日前以货币形式支付给乙方。</p>
  
  <h2 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px;">第三条 劳动保护与工作纪律</h2>
  <p>1. 甲方应为乙方提供符合国家规定的劳动安全卫生设施和必要的劳动防护用品。</p>
  <p>2. 乙方需严格遵守甲方的各项规章制度、工作流程和信息保密协议。</p>

  <h2 style="margin-top: 40px; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px;">第四条 双方签字盖章</h2>
  <div style="margin-top: 30px; display: flex; justify-content: space-between;">
    <div style="width: 45%;">
      <p>甲方（用人单位盖章）：</p>
      <br/>
      <p>代表（签字）：__________________</p>
      <p>日期：______年___月___日</p>
    </div>
    <div style="width: 45%;">
      <p>乙方（劳动者签字）：</p>
      <br/><br/>
      <p>签字：__________________</p>
      <p>日期：______年___月___日</p>
    </div>
  </div>
</div>',
  '',
  '[
    {"name": "employerName", "label": "甲方(用人单位名称)", "type": "text", "required": true, "placeholder": "请输入甲方单位全称", "defaultValue": "北京艾博特科技有限公司"},
    {"name": "employerCode", "label": "统一社会信用代码", "type": "text", "required": true, "placeholder": "91110108MA00XXXXXX"},
    {"name": "employeeName", "label": "乙方(员工姓名)", "type": "text", "required": true, "placeholder": "请输入员工姓名"},
    {"name": "employeeIdNo", "label": "身份证号码", "type": "text", "required": true, "placeholder": "请输入18位身份证号"},
    {"name": "startDate", "label": "合同生效日期", "type": "date", "required": true},
    {"name": "endDate", "label": "合同截止日期", "type": "date", "required": true},
    {"name": "jobTitle", "label": "工作岗位名称", "type": "text", "required": true, "placeholder": "例如：前端开发工程师"},
    {"name": "workLocation", "label": "工作地点", "type": "text", "required": true, "placeholder": "例如：北京", "defaultValue": "北京"},
    {"name": "monthlySalary", "label": "月基本工资(元)", "type": "number", "required": true, "placeholder": "例如：15000"}
  ]'::jsonb,
  'active', -- Set to active so non-admins can use it
  '1.0',
  NULL,
  NOW(),
  NOW()
);

-- 2. Insert Standard NDA Template
INSERT INTO contract_templates (
  id,
  tenant_id,
  name,
  category,
  description,
  template_content,
  file_url,
  variables,
  status,
  version,
  parent_id,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  NULL, -- System preset
  '保密及竞业限制协议模板',
  'nda',
  '保障企业核心商业秘密不外泄，规定脱密期与竞业限制补偿条款，多用于核心技术与管理人员。',
  '<div style="font-family: SimSun, serif; padding: 20px; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto;">
  <h1 style="text-align: center; font-size: 26px; margin-bottom: 30px;">保密及竞业限制协议</h1>
  <p style="text-indent: 2em; margin-bottom: 20px;">鉴于乙方在甲方任职期间，将接触到甲方的商业秘密、技术秘密等核心无形资产。为维护甲方的合法权益，甲乙双方根据《中华人民共和国反不正当竞争法》、《中华人民共和国劳动合同法》等相关法律法规，订立本协议。</p>
  
  <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
    <tr>
      <td style="width: 100px; font-weight: bold; padding: 8px 0;">甲方：</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #333;">{{ companyName }}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 8px 0;">乙方：</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #333;">{{ employeeName }}</td>
    </tr>
  </table>
  
  <h2 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px;">第一条 保密范围与义务</h2>
  <p>1. 本协议所指保密信息包括但不限于：甲方的客户名单、源代码、产品设计、财务数据、商业模式以及特指的 <strong>{{ extraScope }}</strong> 范畴。</p>
  <p>2. 乙方承诺在职期间及离职后，均应对上述保密信息负有绝对保密责任，未经许可不得向第三方披露。</p>

  <h2 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px;">第二条 竞业限制期限与补偿</h2>
  <p>1. 离职后，乙方在 <strong>{{ limitMonths }}</strong> 个月内，不得在与甲方有竞争关系的公司任职或自行从事竞争性业务。</p>
  <p>2. 在竞业限制执行期间，甲方将按月向乙方支付竞业限制补偿金人民币 <strong>{{ compensationPerMonth }}</strong> 元/月。</p>
  
  <h2 style="margin-top: 40px; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px;">第三条 违约责任</h2>
  <p>任何一方违反本协议规定，均应向守约方支付违约金，并赔偿因违约给守约方造成的一切经济损失。</p>

  <h2 style="margin-top: 40px; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 5px;">第四条 双方签署</h2>
  <div style="margin-top: 30px; display: flex; justify-content: space-between;">
    <div style="width: 45%;">
      <p>甲方（公章）：</p>
      <br/>
      <p>代表（签字）：__________________</p>
      <p>日期：______年___月___日</p>
    </div>
    <div style="width: 45%;">
      <p>乙方（签字）：</p>
      <br/><br/>
      <p>签字：__________________</p>
      <p>日期：______年___月___日</p>
    </div>
  </div>
</div>',
  '',
  '[
    {"name": "companyName", "label": "甲方单位名称", "type": "text", "required": true, "placeholder": "请输入甲方单位全称", "defaultValue": "北京艾博特科技有限公司"},
    {"name": "employeeName", "label": "乙方姓名", "type": "text", "required": true, "placeholder": "请输入员工姓名"},
    {"name": "extraScope", "label": "特定保密业务范围", "type": "text", "required": true, "placeholder": "如：AI招聘算法模型源代码", "defaultValue": "所有与项目相关的核心秘密"},
    {"name": "limitMonths", "label": "竞业限制月数", "type": "number", "required": true, "placeholder": "常规12个月", "defaultValue": 12},
    {"name": "compensationPerMonth", "label": "月度竞业限制补偿金(元)", "type": "number", "required": true, "placeholder": "例如：3000"}
  ]'::jsonb,
  'active',
  '1.0',
  NULL,
  NOW(),
  NOW()
);
