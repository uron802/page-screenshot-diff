import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import http from 'http';
import fs from 'fs';
import path from 'path';
import * as yaml from 'yaml';

// Puppeteer モックを定義
const goto = jest.fn();
const click = jest.fn();
const type = jest.fn();
const screenshot = jest.fn();
const waitForNavigation = jest.fn(() => Promise.resolve());
const page = { goto, click, type, screenshot, waitForNavigation };
const newPage = jest.fn(async () => page);
const close = jest.fn();
const browser = { newPage, close };
const launch = jest.fn(async () => browser);

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: { launch },
  launch
}));

const puppeteerAny = { launch, newPage, goto, click, type, screenshot } as any;


let server: http.Server;
let port: number;

beforeAll(done => {
  server = http.createServer((req, res) => {
    if (req.url === '/page2') {
      res.end('<html><body><h1>page2</h1></body></html>');
    } else {
      res.end('<html><body><form action="/page2"><input id="user" name="user"><button id="login">Login</button></form></body></html>');
    }
  }).listen(0, () => {
    const addr = server.address() as any;
    port = addr.port;
    done();
  });
});

afterAll(done => {
  server.close(done);
});

describe('runScenario', () => {
  let tmpDirs: string[] = [];

  afterEach(() => {
    jest.clearAllMocks();
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs = [];
  });

  it('シナリオを実行して各アクションを呼び出す', async () => {
    const tmp = fs.mkdtempSync(path.join(process.cwd(), 'scenario-test-'));
    tmpDirs.push(tmp);
    const scenarioPath = path.join(tmp, 'scenario.yml');
    const paramsPath = path.join(tmp, 'params.csv');
    const outputDir = path.join(tmp, 'out');

    const scenario = {
      defaultTimeout: 500,
      actions: [
        { action: 'goto', url: `http://localhost:${port}/` },
        { action: 'type', selector: '#user', text: '${name}' },
        { action: 'click', selector: '#login', wait: 150 },
        { action: 'wait', wait: 100 }
      ]
    };
    fs.writeFileSync(scenarioPath, yaml.stringify(scenario));
    fs.writeFileSync(paramsPath, 'name,age\nalice,20\n');
    fs.mkdirSync(outputDir);

    const mod = await import('../src/scenario.js');
    await mod.runScenario(scenarioPath, paramsPath, outputDir, true, puppeteerAny);
    expect(launch).toHaveBeenCalled();
    expect(puppeteerAny.newPage).toHaveBeenCalled();
    expect(puppeteerAny.goto).toHaveBeenCalled();
    expect(puppeteerAny.type).toHaveBeenCalledWith('#user', 'alice');
    expect(puppeteerAny.click).toHaveBeenCalledWith('#login');
    expect(puppeteerAny.screenshot.mock.calls.length).toBe(4);
  });

  it('screenshotをfalseにしたアクションは撮影しない', async () => {
    const tmp = fs.mkdtempSync(path.join(process.cwd(), 'scenario-nosshot-'));
    tmpDirs.push(tmp);
    const scenarioPath = path.join(tmp, 'scenario.yml');
    const paramsPath = path.join(tmp, 'params.csv');
    const outputDir = path.join(tmp, 'out');

    const scenario = {
      actions: [
        { action: 'goto', url: `http://localhost:${port}/`, screenshot: false },
        { action: 'wait', wait: 50 }
      ]
    };
    fs.writeFileSync(scenarioPath, yaml.stringify(scenario));
    fs.writeFileSync(paramsPath, 'x\n1\n');
    fs.mkdirSync(outputDir);

    const mod = await import('../src/scenario.js');
    await mod.runScenario(scenarioPath, paramsPath, outputDir, true, puppeteerAny);
    expect(puppeteerAny.screenshot.mock.calls.length).toBe(1);
  });

  it('CLIで--outputオプションを解釈できる', async () => {
    const tmp = fs.mkdtempSync(path.join(process.cwd(), 'scenario-cli-'));
    tmpDirs.push(tmp);
    const scenarioPath = path.join(tmp, 'sc.yml');
    const paramsPath = path.join(tmp, 'pr.csv');
    fs.writeFileSync(scenarioPath, yaml.stringify({ actions: [] }));
    fs.writeFileSync(paramsPath, 'a\n1\n');

    const mod = await import('../src/scenario.js');
    const outDir = path.join(tmp, 'out');
    const result = mod.parseArgs(['--scenario', scenarioPath, '--params', paramsPath, '--output', outDir]);
    expect(result).toEqual({ scenarioPath, paramsPath, outputDir: outDir, headless: true });
  });

  it('--headlessオプションをfalseで解釈できる', async () => {
    const tmp = fs.mkdtempSync(path.join(process.cwd(), 'scenario-cli-h-'));
    tmpDirs.push(tmp);
    const scenarioPath = path.join(tmp, 'sc.yml');
    const paramsPath = path.join(tmp, 'pr.csv');
    fs.writeFileSync(scenarioPath, yaml.stringify({ actions: [] }));
    fs.writeFileSync(paramsPath, 'a\n1\n');

    const mod = await import('../src/scenario.js');
    const outDir = path.join(tmp, 'out');
    const result = mod.parseArgs(['--scenario', scenarioPath, '--params', paramsPath, '--output', outDir, '--headless', 'false']);
    expect(result).toEqual({ scenarioPath, paramsPath, outputDir: outDir, headless: false });
  });
});
