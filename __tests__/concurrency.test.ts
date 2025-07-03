import { jest, describe, it, expect, afterEach, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import http from 'http';
const screenshotModule = await import('../src/screenshot.js');

const tmpDirs: string[] = [];
let server: http.Server;
let port: number;

beforeAll(done => {
  server = http.createServer((_req, res) => {
    res.end('<html><body>ok</body></html>');
  }).listen(0, () => {
    port = (server.address() as any).port;
    done();
  });
});

afterAll(done => {
  server.close(done);
});

afterEach(() => {
  jest.clearAllMocks();
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs.length = 0;
});

describe('並列処理オプション', () => {
  it('--concurrencyで指定した数ずつ並列実行される', async () => {
    const tmp = fs.mkdtempSync(path.join(process.cwd(), 'conc-test-'));
    tmpDirs.push(tmp);
    const outputDir = path.join(tmp, 'out');
    fs.mkdirSync(outputDir);

    const batch = [
      { url: `http://localhost:${port}/1`, filename: '1' },
      { url: `http://localhost:${port}/2`, filename: '2' },
      { url: `http://localhost:${port}/3`, filename: '3' }
    ];

    const startTimes: number[] = [];
    const mockShot = jest.fn(async (u: string, outputPath: string) => {
      startTimes.push(Date.now());
      await new Promise<void>(resolve => {
        http.get(u, res => {
          res.resume();
          res.on('end', resolve);
        });
      });
      fs.writeFileSync(outputPath, 'x');
      await new Promise(res => setTimeout(res, 50));
    });

    const start = Date.now();
    await screenshotModule.captureBatch(batch, outputDir, mockShot);
    const duration = Date.now() - start;

    expect(startTimes.length).toBe(3);
    expect(Math.abs(startTimes[1] - startTimes[0])).toBeLessThan(20);
    expect(Math.abs(startTimes[2] - startTimes[0])).toBeLessThan(20);
    expect(duration).toBeGreaterThanOrEqual(45);
    expect(duration).toBeLessThan(200);
  });
});
