import { loadConfig } from './types/config.js';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

function launchBrowser() {
  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

export function parseArgs(args: string[]) {
  let concurrency = 1;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--concurrency' || arg === '-c') {
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        concurrency = parseInt(value, 10);
        i++;
      }
    } else if (arg.startsWith('--concurrency=')) {
      concurrency = parseInt(arg.split('=')[1], 10);
    }
  }
  if (!Number.isFinite(concurrency) || concurrency <= 0) {
    concurrency = 1;
  }
  return { concurrency };
}

export async function captureBatch(
  batch: { url: string; filename: string }[],
  outputDir: string,
  screenshotFn: typeof takeScreenshot = takeScreenshot
) {
  await Promise.all(
    batch.map(async urlConfig => {
      try {
        const outputPath = path.join(outputDir, `${urlConfig.filename}.png`);
        await screenshotFn(urlConfig.url, outputPath);
        fs.chmodSync(outputPath, 0o666);
        console.log(`Successfully captured screenshot for: ${urlConfig.url}`);
      } catch (error) {
        console.error(`Failed to capture ${urlConfig.url}:`, error);
      }
    })
  );
}

// テスト用にエクスポート
export async function takeScreenshot(url: string, outputPath: string): Promise<void> {
  let browser = null;
  try {
    browser = await launchBrowser();
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
  const { concurrency } = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  
  try {
    // output/subdirectoryのパスを生成
    const outputDir = path.join(process.cwd(), 'output', config.output.subdirectory);
    console.log(`Output directory: ${outputDir}`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true, mode: 0o777 });
    }
    fs.chmodSync(outputDir, 0o777);

    const queue = [...config.urls];
    while (queue.length) {
      const batch = queue.splice(0, concurrency);
      await captureBatch(batch, outputDir);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// テスト環境ではない場合のみmain関数を実行
// Jest環境やDockerテスト環境では実行しない
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID && !process.env.TEST_IN_DOCKER) {
  main().catch(console.error);
}

// テスト用にデフォルトエクスポート
export default {
  takeScreenshot,
  main,
  parseArgs,
  captureBatch
};