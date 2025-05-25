import { loadConfig } from './types/config.js';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

// テスト用にエクスポート
export async function takeScreenshot(url: string, outputPath: string): Promise<void> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await page.screenshot({ path: outputPath, fullPage: true });
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// テスト用にエクスポート
export async function main(): Promise<void> {
  const config = loadConfig();
  
  try {
    // output/subdirectoryのパスを生成
    const outputDir = path.join(process.cwd(), 'output', config.output.subdirectory);
    console.log(`Output directory: ${outputDir}`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const urlConfig of config.urls) {
      try {
        const outputPath = path.join(outputDir, `${urlConfig.filename}.png`);
        await takeScreenshot(urlConfig.url, outputPath);
        console.log(`Successfully captured screenshot for: ${urlConfig.url}`);
      } catch (error) {
        console.error(`Failed to capture ${urlConfig.url}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// テスト環境ではない場合のみmain関数を実行
if (process.env.NODE_ENV !== 'test') {
  main().catch(console.error);
}

// テスト用にデフォルトエクスポート
export default {
  takeScreenshot,
  main
};