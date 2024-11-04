// types.ts
interface Screenshot {
  url: string;
  filename: string;
}

interface Config {
  output_directory: string;
  screenshots: Screenshot[];
}

// index.ts
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import puppeteer from 'puppeteer';

function loadConfig(): Config {
  try {
    const configPath = path.join(process.cwd(), 'config.yml');
    const file = fs.readFileSync(configPath, 'utf8');
    const config = yaml.parse(file) as Config;
    
    if (!config || !config.output_directory || !Array.isArray(config.screenshots)) {
      throw new Error('Invalid config format');
    }
    
    return config;
  } catch (error) {
    console.error('Config loading error:', error);
    process.exit(1);
  }
}

async function takeScreenshot(url: string, outputPath: string): Promise<void> {
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

async function main(): Promise<void> {
  const config = loadConfig();
  
  try {
    const outputDir = config.output_directory;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const screenshot of config.screenshots) {
      try {
        const outputPath = path.join(outputDir, `${screenshot.filename}.png`);
        await takeScreenshot(screenshot.url, outputPath);
        console.log(`Captured screenshot for: ${screenshot.url}`);
      } catch (error) {
        console.error(`Failed to capture ${screenshot.url}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error);