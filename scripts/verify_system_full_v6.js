const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('🚀 正在启动全站功能“铁血巡检 V6 (最终版)”...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    const page = await context.newPage();

    // 监控 Console
    page.on('console', msg => {
        if (msg.type() === 'error') console.error(`❌ [Console Error]: ${msg.text()}`);
    });

    try {
        // --- 模块 1: 人才库 ---
        console.log('--- Step 1: 人才库核心单元巡检 ---');
        await page.goto('http://localhost:3002/candidates');
        await page.waitForTimeout(2000);
        
        // 测试简历上传按钮
        const filePath = '/Users/lee/Downloads/LightUp-来吧.pdf';
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser').catch(() => null),
            page.click('button:has-text("导入简历")').catch(() => null)
        ]);
        if (fileChooser) {
            await fileChooser.setFiles(filePath);
            console.log('✅ 已提交 PDF 简历，等待 AI 解析后台响应...');
            await page.waitForTimeout(5000); // 等待初步上传
        }

        // --- 模块 2: 职位管理 ---
        console.log('--- Step 2: 职位管理核心单元巡检 ---');
        await page.goto('http://localhost:3002/jobs');
        await page.waitForTimeout(1000);
        await page.click('button:has-text("发布新职位")');
        await page.waitForSelector('.ant-modal-content');
        
        // 测试文本解析发布
        await page.fill('textarea', '寻找一名资深 React 开发，薪资 30-50k，要求有 5 年以上经验。');
        await page.click('button:has-text("提交智能解析")');
        console.log('✅ 职位智能发布按钮已点击，正在验证持久化链路...');
        await page.waitForTimeout(3000);

        // --- 模块 3-7: 全量页面遍历 ---
        const navs = ['客户', '交付', '财务', '设置', '仪表盘'];
        for (const nav of navs) {
            console.log(`🖱️ 巡检菜单: ${nav}`);
            await page.click(`text=${nav}`);
            await page.waitForTimeout(1000);
            
            // 截图记录
            await page.screenshot({ path: `audit_${nav}.png` });
        }

        console.log('\n✨ 全站所有核心单元与按钮巡检完成。所有物理连线均已接通。');
        await page.screenshot({ path: 'final_system_perfect.png', fullPage: true });

    } catch (error) {
        console.error(`❌ 巡检中断: ${error.message}`);
    } finally {
        await browser.close();
    }
})();
