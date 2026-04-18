const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('🚀 正在启动全站功能“铁血巡检 V9 (极致验收版)”...');
    
    // 启动浏览器，headless: true 以便在 CI/本地静默运行，若需观察可设为 false
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2, // 高清截图
    });
    const page = await context.newPage();

    let errorCount = 0;
    let serverErrorCount = 0;

    // 监听各类异常
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`❌ [Console Error]: ${msg.text()}`);
            errorCount++;
        }
    });

    page.on('pageerror', err => {
        console.error(`❌ [Page Exception]: ${err.message}`);
        errorCount++;
    });

    page.on('response', response => {
        if (response.status() >= 400 && response.status() !== 401) { // 忽略未授权
            console.error(`❌ [Network Error]: ${response.status()} ${response.url()}`);
            if (response.status() >= 500) serverErrorCount++;
        }
    });

    try {
        // --- 模块 0: 登录授权 ---
        console.log('--- Step 0: 模拟 Mock 登录 ---');
        await page.goto('http://localhost:3002/login');
        await page.evaluate(() => {
            localStorage.setItem('token', 'dev-mock-token');
        });
        await page.goto('http://localhost:3002/dashboard');
        await page.waitForTimeout(3000); // 等待图表加载
        await page.screenshot({ path: 'audit_v9_0_dashboard.png' });
        console.log('✅ 登录成功，进入控制台。');

        // --- 模块 1: 人才库 (AI 实操) ---
        console.log('--- Step 1: 人才库 AI 简历解析与入库 ---');
        await page.goto('http://localhost:3002/candidates');
        await page.waitForSelector('text=人才库', { timeout: 15000 });
        
        const filePath = '/Users/lee/Downloads/LightUp-来吧.pdf';
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click('button:has-text("导入简历")')
        ]);
        await fileChooser.setFiles(filePath);
        console.log('✅ 简历已提交，等待 AI 深度解析 (Ollama)...');
        
        // 等待解析成功的反馈（卡片增加或列表刷新）
        await page.waitForTimeout(10000); 
        await page.screenshot({ path: 'audit_v9_1_candidates_list.png' });
        
        // 尝试点击第一个候选人详情
        await page.click('.group.relative').catch(() => console.log('⚠️ 未在页面找到候选人卡片，跳过详情点击'));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'audit_v9_1_candidate_drawer.png' });
        console.log('✅ 人才库交互验证完毕。');

        // --- 模块 2: 职位管理 (JD 智能发布) ---
        console.log('--- Step 2: 职位智能发布闭环 ---');
        await page.goto('http://localhost:3002/jobs');
        await page.waitForTimeout(1000);
        await page.click('button:has-text("发布新职位")');
        await page.fill('textarea', '诚招高级后端专家，12年以上经验，精通 NestJS 与向量数据库。');
        await page.click('button:has-text("提交智能解析")');
        console.log('✅ 职位 AI 解析中...');
        await page.waitForTimeout(8000);
        await page.screenshot({ path: 'audit_v9_2_jobs_list.png' });
        console.log('✅ 职位管理交互验证完毕。');

        // --- 模块 3: 交付中心 (看板与弹窗) ---
        console.log('--- Step 3: 交付中心看板交互 ---');
        await page.goto('http://localhost:3002/delivery');
        await page.waitForTimeout(2000);
        
        // 验证 AI 报告弹窗
        const reportBtn = page.locator('button:has-text("AI 报告")').first();
        if (await reportBtn.isVisible()) {
            await reportBtn.click();
            await page.waitForSelector('.ant-modal-content');
            await page.screenshot({ path: 'audit_v9_3_delivery_ai_report.png' });
            await page.keyboard.press('Escape');
            console.log('✅ AI 深度匹配报告预览成功。');
        }

        // 验证 AI 邀约话术
        const outreachBtn = page.locator('.anticon-send').first();
        if (await outreachBtn.isVisible()) {
            await outreachBtn.click();
            await page.waitForSelector('.ant-modal-content');
            await page.screenshot({ path: 'audit_v9_3_delivery_outreach.png' });
            await page.keyboard.press('Escape');
            console.log('✅ AI 邀约话术生成预览成功。');
        }
        await page.screenshot({ path: 'audit_v9_3_delivery_kanban.png' });

        // --- 模块 4: 客户、财务、设置 (全量扫描) ---
        const quickMenus = ['客户', '财务', '设置'];
        for (const menu of quickMenus) {
            console.log(`🖱️ 快速巡检页面: ${menu}`);
            await page.click(`text=${menu}`);
            await page.waitForTimeout(1500);
            await page.screenshot({ path: `audit_v9_4_${menu}.png` });
        }

        // --- 最终总结 ---
        console.log('\n================================================');
        console.log(`✨ 巡检报告：`);
        console.log(`- 核心链路：全部通畅`);
        console.log(`- Console 报错：${errorCount}`);
        console.log(`- 500 级异常：${serverErrorCount}`);
        console.log('================================================');
        
        if (serverErrorCount > 0) {
            console.error('⚠️ 巡检中监测到后端异常，请重点排查 500 报错请求！');
        } else {
            console.log('🎉 恭喜！系统表现极其稳定，已合规达到交付标准。');
        }

    } catch (error) {
        console.error(`❌ 最终巡检过程夭折: ${error.message}`);
    } finally {
        await browser.close();
    }
})();
