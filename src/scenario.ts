import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Page } from 'puppeteer';
import * as yaml from 'yaml';

interface ScenarioAction {
  action: string;
  url?: string;
  selector?: string;
  text?: string;
  /** waitアクションで指定する待機ミリ秒 */
  wait?: number;
  timeout?: number;
  screenshot?: string;
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

async function runAction(page: Page, action: ScenarioAction, params: Params, defaultTimeout: number, outputDir: string, rowIndex: number, actionIndex: number) {
  const timeout = action.timeout ?? defaultTimeout;
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
        break;
      case 'type':
        if (!action.selector || action.text === undefined) throw new Error('type requires selector and text');
        await page.type(action.selector, substitute(action.text, params));
        break;
      case 'wait':
        if (typeof action.wait !== 'number') throw new Error('wait requires time');
        await (page as any).waitForTimeout(action.wait);
        break;
      default:
        throw new Error(`Unknown action: ${action.action}`);
    }

    const name = action.screenshot ?? `${rowIndex + 1}-${actionIndex + 1}`;
    const file = path.join(outputDir, `${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
  } catch (e) {
    console.error('Action failed:', e);
    throw e;
  }
}

export async function runScenario(
  scenarioFile: string,
  paramsFile: string,
  outputBase: string,
  puppeteerLib: typeof puppeteer = puppeteer
) {
  const scenario = yaml.parse(fs.readFileSync(scenarioFile, 'utf8')) as Scenario;
  const records = parseCsv(paramsFile);
  const defaultTimeout = scenario.defaultTimeout ?? 10000;

  for (let i = 0; i < records.length; i++) {
    const params = records[i];
    const runDir = path.join(outputBase, `${i}`);
    fs.mkdirSync(runDir, { recursive: true });

    const browser = await puppeteerLib.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    try {
      for (let j = 0; j < scenario.actions.length; j++) {
        const action = scenario.actions[j];
        await runAction(page, action, params, defaultTimeout, runDir, i, j);
      }
    } catch (e) {
      console.error('Scenario aborted due to error');
    } finally {
      await browser.close();
    }
  }
}

export function parseArgs(args: string[]) {
  let scenarioPath = path.join('env', 'scenario.yml');
  let paramsPath = path.join('env', 'params.csv');
  let outputDir = path.join('output', 'scenario');

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
      default:
        if (arg.startsWith('--output=')) {
          outputDir = arg.split('=')[1];
        }
        break;
    }
  }
  return { scenarioPath, paramsPath, outputDir };
}

export async function main() {
  const { scenarioPath, paramsPath, outputDir } = parseArgs(process.argv.slice(2));
  await runScenario(scenarioPath, paramsPath, outputDir);
}

if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID && !process.env.TEST_IN_DOCKER) {
  main().catch(console.error);
}

export default {
  runScenario,
  main,
  parseArgs
};
