import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Page } from 'puppeteer';

function connectOrLaunch(puppeteerLib: typeof puppeteer, headless: boolean) {
  const ws = process.env.PUPPETEER_WS_ENDPOINT || process.env.WS_ENDPOINT;
  if (ws) {
    return puppeteerLib.connect({ browserWSEndpoint: ws });
  }
  return puppeteerLib.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless
  });
}
import * as yaml from 'yaml';

// 指定ミリ秒だけ待機するユーティリティ
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ScenarioAction {
  action: string;
  url?: string;
  selector?: string;
  text?: string;
  /** waitアクションやclickアクションで使用する待機ミリ秒 */
  wait?: number;
  timeout?: number;
  /**
   * スクリーンショットファイル名。
   * false を指定すると撮影しない。
   * true または未指定の場合はデフォルト名で撮影。
   */
  screenshot?: string | boolean;
}

interface Scenario {
  name?: string;
  defaultTimeout?: number;
  actions: ScenarioAction[];
}

interface Params {
  [key: string]: string;
}

function parseCsv(file: string): Params[] {
  const data = fs.readFileSync(file, 'utf8').trim();
  const [headerLine, ...lines] = data.split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines.map(line => {
    const cols = line.split(',');
    const record: Params = {};
    headers.forEach((h, i) => {
      record[h] = cols[i] ?? '';
    });
    return record;
  });
}

function substitute(template: string, params: Params): string {
  return template.replace(/\${(.*?)}/g, (_, key) => params[key] ?? '');
}

async function runAction(
  page: Page,
  action: ScenarioAction,
  params: Params,
  defaultTimeout: number,
  outputDir: string,
  rowIndex: number,
  actionIndex: number
) {
  const timeout = action.timeout ?? defaultTimeout;
  const label = `${rowIndex + 1}-${actionIndex + 1}`;
  console.log(`[${label}] ${action.action} 開始`);
  try {
    switch (action.action) {
      case 'goto':
        if (!action.url) throw new Error('goto requires url');
        await page.goto(substitute(action.url, params), { waitUntil: 'networkidle2', timeout });
        break;
      case 'click':
        if (!action.selector) throw new Error('click requires selector');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout }).catch(() => {}),
          page.click(action.selector)
        ]);
        if (typeof action.wait === 'number') {
          await sleep(action.wait);
        }
        break;
      case 'type':
        if (!action.selector || action.text === undefined) throw new Error('type requires selector and text');
        await page.type(action.selector, substitute(action.text, params));
        break;
      case 'wait':
        if (typeof action.wait !== 'number') throw new Error('wait requires time');
        await sleep(action.wait);
        break;
      default:
        throw new Error(`Unknown action: ${action.action}`);
    }

    if (action.screenshot !== false) {
      const name =
        typeof action.screenshot === 'string' && action.screenshot !== ''
          ? action.screenshot
          : `${rowIndex + 1}-${actionIndex + 1}`;
      const file = path.join(outputDir, `${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      if (fs.existsSync(file)) {
        fs.chmodSync(file, 0o666);
      }
      console.log(`[${label}] スクリーンショット保存: ${file}`);
    } else {
      console.log(`[${label}] 完了`);
    }
  } catch (e) {
    console.error('Action failed:', e);
    throw e;
  }
}

export async function runScenario(
  scenarioFile: string,
  paramsFile: string,
  outputBase: string,
  headless = true,
  puppeteerLib: typeof puppeteer = puppeteer
) {
  const scenario = yaml.parse(fs.readFileSync(scenarioFile, 'utf8')) as Scenario;
  const records = parseCsv(paramsFile);
  const defaultTimeout = scenario.defaultTimeout ?? 10000;

  fs.mkdirSync(outputBase, { recursive: true, mode: 0o777 });
  fs.chmodSync(outputBase, 0o777);
  console.log(`Output directory: ${outputBase}`);

  for (let i = 0; i < records.length; i++) {
    const params = records[i];
    console.log(`---- ${i + 1} 行目開始 ----`);

    const browser = await connectOrLaunch(puppeteerLib, headless);
    const page = await browser.newPage();
    try {
      for (let j = 0; j < scenario.actions.length; j++) {
        const action = scenario.actions[j];
        await runAction(page, action, params, defaultTimeout, outputBase, i, j);
      }
    } catch (e) {
      console.error('Scenario aborted due to error');
    } finally {
      await browser.close();
      console.log(`---- ${i + 1} 行目終了 ----`);
    }
  }
}

export function parseArgs(args: string[]) {
  let scenarioPath = path.join('env', 'scenario.yml');
  let paramsPath = path.join('env', 'params.csv');
  let outputDir = path.join('output', 'scenario');
  let headless = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--scenario':
        scenarioPath = args[++i];
        break;
      case '--params':
        paramsPath = args[++i];
        break;
      case '--output':
      case '-o':
        outputDir = args[++i];
        break;
      case '--headless':
        {
          const value = args[i + 1];
          if (value && !value.startsWith('--')) {
            headless = value !== 'false';
            i++;
          } else {
            headless = true;
          }
        }
        break;
      default:
        if (arg.startsWith('--output=')) {
          outputDir = arg.split('=')[1];
        } else if (arg.startsWith('--headless=')) {
          const value = arg.split('=')[1];
          headless = value !== 'false';
        }
        break;
    }
  }
  return { scenarioPath, paramsPath, outputDir, headless };
}

export async function main() {
  const { scenarioPath, paramsPath, outputDir, headless } = parseArgs(process.argv.slice(2));
  await runScenario(scenarioPath, paramsPath, outputDir, headless);
}

if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID && !process.env.TEST_IN_DOCKER) {
  main().catch(console.error);
}

export default {
  runScenario,
  main,
  parseArgs
};
