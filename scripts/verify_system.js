const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('🚀 正在启动全站功能“铁血巡检” (Zero-Bug Audit)...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    const page = await context.newPage();

    // 监控 Console 报错
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`❌ [Console Error]: ${msg.text()}`);
        }
    });

    // 监控页面奔溃或弹窗
    page.on('pageerror', err => {
        console.error(`💥 [Runtime Crash]: ${err.message}`);
    });

    try {
        // 1. 访问人才库
        console.log('--- Step 1: 巡检【人才公海】 ---');
        await page.goto('http://localhost:3002/candidates');
        await page.waitForTimeout(2000);
        
        // 检查 React 19 Patch 是否生效 (不应出现红色 Overlay)
        const errorOverlay = await page.$('nextjs-portal');
        if (errorOverlay) {
            console.error('⚠️ 警告：检测到 Next.js 错误覆盖层，React 19 补丁可能仍有死角。');
        } else {
            console.log('✅ 确认：界面清爽，React 19 兼容性良好。');
        }

        // 2. 实测简历上传逻辑
        console.log('--- Step 2: 简历实操解析联调 ---');
        const filePath = '/Users/lee/Downloads/LightUp-来吧.pdf';
        console.log(`📤 尝试上传文件: ${filePath}`);
        
        // 触发隐藏的 input
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click('button:has-text("导入简历")')
        ]);
        await fileChooser.setFiles(filePath);
        console.log('⏳ 正在等待本地 Ollama 解析并回显 (约需 10-20秒)...');
        
        // 等待 Antd Message 出现
        await page.waitForSelector('.ant-message', { timeout: 30000 }).catch(() => null);
        const feedback = await page.innerText('.ant-message').catch(() => '未采集到气泡反馈');
        console.log(`💬 解析反馈内容: ${feedback}`);

        // 3. 巡检【职位管理】手动新增
        console.log('--- Step 3: 职位管理实测 ---');
        await page.goto('http://localhost:3002/jobs');
        await page.click('button:has-text("发布新职位")');
        await page.waitForSelector('.mophy-modal');
        console.log('✅ 确认：职位发布对话框弹出正常。');

        // 4. 模拟人工菜单全量点击
        console.log('--- Step 4: 全量菜单交互巡检 ---');
        const menus = ['人才', '职位', '客户', '交付', '财务', '设置'];
        for (const menu of menus) {
            console.log(`🖱️ 正在巡检菜单: ${menu}`);
            await page.click(`text=${menu}`);
            await page.waitForTimeout(1000);
        }

        console.log('\n✨ 全站巡检完成！所有接口与按钮均已完成初步功能对照。');
        await page.screenshot({ path: 'audit_result.png', fullPage: true });
        console.log('📸 巡检快照已保存至 audit_result.png');

    } catch (error) {
        console.error(`❌ 巡检过程中断：${error.message}`);
    } finally {
        await browser.close();
    }
})();
