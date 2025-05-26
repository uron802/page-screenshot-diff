import { jest, describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('統合テスト', () => {
  // スクリーンショット機能と差分比較機能が存在すること確認
  it('必要なモジュールが存在する', async () => {
    const screenshotModule = await import('../src/screenshot.js');
    expect(screenshotModule.default).toBeDefined();
    expect(typeof screenshotModule.default.takeScreenshot).toBe('function');
    expect(typeof screenshotModule.default.main).toBe('function');
    
    const diffModule = await import('../src/diff.js');
    expect(diffModule.default).toBeDefined();
    expect(typeof diffModule.default.compareAndMergeImages).toBe('function');
    expect(typeof diffModule.default.writeLog).toBe('function');
    expect(typeof diffModule.default.main).toBe('function');
    
    const { loadConfig, loadDiffConfig } = await import('../src/types/config.js');
    expect(typeof loadConfig).toBe('function');
    expect(typeof loadDiffConfig).toBe('function');
  });
  
  // ビルドされたJSファイルが正しく存在することを確認
  it('ビルド後の必要なファイルが存在する', () => {
    const buildFiles = [
      'dist/index.js',
      'dist/screenshot.js',
      'dist/diff.js',
      'dist/types/config.js'
    ];
    
    for (const file of buildFiles) {
      const exists = fs.existsSync(path.resolve(process.cwd(), file));
      expect(exists).toBe(true);
    }
  });
  
  // 設定ファイルが正しく存在することを確認
  it('設定ファイルが正しく存在する', () => {
    const configFiles = [
      'screenshot.yml',
      'diff.yml'
    ];
    
    for (const file of configFiles) {
      const exists = fs.existsSync(path.resolve(process.cwd(), file));
      expect(exists).toBe(true);
    }
  });
});