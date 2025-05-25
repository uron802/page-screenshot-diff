import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ビルドプロセスのテスト
describe('ビルドプロセステスト', () => {
  const distDir = path.join(process.cwd(), 'dist');

  // テスト前にビルドを実行
  beforeAll(async () => {
    try {
      // 既存のdistディレクトリがあれば削除
      if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
      }
      
      // ビルド実行
      await execAsync('npm run build');
    } catch (error) {
      console.error('ビルドエラー:', error);
    }
  }, 30000); // タイムアウトを30秒に設定

  it('ビルドでdistディレクトリが作成される', () => {
    expect(fs.existsSync(distDir)).toBe(true);
  });

  it('必要なJSファイルがビルドされる', () => {
    const files = [
      'screenshot.js',
      'diff.js',
      'types/config.js'
    ];
    
    for (const file of files) {
      const filePath = path.join(distDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('ビルドされたファイルがJavaScriptとして有効', () => {
    const configJsPath = path.join(distDir, 'types', 'config.js');
    const content = fs.readFileSync(configJsPath, 'utf8');
    
    // ESモジュールの特徴を持っているか確認
    expect(content).toContain('export ');
    expect(content).toMatch(/import .* from/);
  });
});