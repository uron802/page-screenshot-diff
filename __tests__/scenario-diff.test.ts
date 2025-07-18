import { jest, describe, it, expect, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

jest.mock('../src/diff.js', () => ({
  __esModule: true,
  compareAndMergeImages: jest.fn(() => ({ isMatch: true }))
}));

const mod = await import('../src/scenarioDiff.js');

function createPng(file: string, value: number) {
  const png = new PNG({ width: 1, height: 1 });
  png.data[0] = value;
  png.data[1] = value;
  png.data[2] = value;
  png.data[3] = 255;
  fs.writeFileSync(file, PNG.sync.write(png));
}

describe('diffScenario', () => {
  let tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs = [];
  });

  it('同じ画像は一致と判定される', () => {
    const dir1 = fs.mkdtempSync(path.join(process.cwd(), 'sdiff1-'));
    const dir2 = fs.mkdtempSync(path.join(process.cwd(), 'sdiff2-'));
    tmpDirs.push(dir1, dir2);
    const f1 = path.join(dir1, '1-1.png');
    const f2 = path.join(dir2, '1-1.png');
    createPng(f1, 0);
    createPng(f2, 0);
    const result = mod.diffScenario(dir1, dir2, 0.1);
    expect(result).toBe(true);
  });

  it('異なる画像は不一致と判定される', () => {
    const dir1 = fs.mkdtempSync(path.join(process.cwd(), 'sdiff3-'));
    const dir2 = fs.mkdtempSync(path.join(process.cwd(), 'sdiff4-'));
    tmpDirs.push(dir1, dir2);
    const f1 = path.join(dir1, '1-1.png');
    const f2 = path.join(dir2, '1-1.png');
    createPng(f1, 0);
    createPng(f2, 255);
    const result = mod.diffScenario(dir1, dir2, 0.1);
    expect(result).toBe(false);
  });

  it('mainで--thresholdオプションを解釈できる', () => {
    const oldDir = fs.mkdtempSync(path.join(process.cwd(), 'sdiff-cli-old-'));
    const newDir = fs.mkdtempSync(path.join(process.cwd(), 'sdiff-cli-new-'));
    tmpDirs.push(oldDir, newDir);
    const file1 = path.join(oldDir, '1-1.png');
    const file2 = path.join(newDir, '1-1.png');
    createPng(file1, 0);
    createPng(file2, 1); // わずかな差分

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    process.argv = ['node', 'scenarioDiff.js', '--old', oldDir, '--new', newDir, '--threshold', '0.01'];
    mod.main();
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('一致');
    logSpy.mockRestore();
  });

  it('存在しないディレクトリが指定された場合はfalseを返す', () => {
    const missingDir = path.join(process.cwd(), 'no-such-dir');
    const dir2 = fs.mkdtempSync(path.join(process.cwd(), 'sdiff-missing-'));
    tmpDirs.push(dir2);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = mod.diffScenario(missingDir, dir2, 0.1);
    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
