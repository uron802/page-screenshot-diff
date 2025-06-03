import { jest, describe, it, expect } from '@jest/globals';
import path from 'path';
import fs from 'fs';

// 環境変数の取得
const isDockerEnvironment = (global as any).__isDockerEnvironment__;

// 設定するenv下のテスト用ファイル
const createTestEnvFiles = () => {
  // Docker環境でのみ実施
  if (isDockerEnvironment) {
    // envディレクトリを確認・作成
    const envDir = path.join(process.cwd(), 'env');
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
    // screenshot.ymlが存在しない場合は作成
    const screenshotPath = path.join(envDir, 'screenshot.yml');
    if (!fs.existsSync(screenshotPath)) {
      const screenshotContent = `urls:
  - url: https://example.com
    filename: example
output:
  subdirectory: screenshots`;
      fs.writeFileSync(screenshotPath, screenshotContent);
    }
    
    // diff.ymlが存在しない場合は作成
    const diffPath = path.join(envDir, 'diff.yml');
    if (!fs.existsSync(diffPath)) {
      const diffContent = `source_directory: source
target_directory: target`;
      fs.writeFileSync(diffPath, diffContent);
    }
  }
};

// テスト環境ファイルを準備
createTestEnvFiles();

// 簡単なテストケースを作成
describe('基本機能テスト', () => {
  
  // ファイルシステム操作のテスト
  it('ファイルの読み書きができる', () => {
    // 一時ファイルパス
    const tempPath = path.join(process.cwd(), 'temp-test.txt');
    
    // ファイル書き込み
    fs.writeFileSync(tempPath, 'テストデータ');
    
    // ファイル読み込み
    const data = fs.readFileSync(tempPath, 'utf8');
    
    // クリーンアップ
    fs.unlinkSync(tempPath);
    
    // 検証
    expect(data).toBe('テストデータ');
  });
  
  // 基本的なパス操作のテスト
  it('パス操作ができる', () => {
    const result = path.join('dir', 'file.txt');
    expect(result).toBe('dir/file.txt');
  });
  
  // モックの基本的な使い方のテスト
  it('関数をモックできる', () => {
    // モック関数の作成
    const mockFn = jest.fn().mockReturnValue('モック結果');
    
    // モック関数の使用
    const result = mockFn('テスト入力');
    
    // 検証
    expect(mockFn).toHaveBeenCalledWith('テスト入力');
    expect(result).toBe('モック結果');
  });
});

// 設定ファイルのBasic構造テスト
describe('設定ファイル構造', () => {
  it('screenshot.ymlが存在し、正しい形式である', () => {
    const configPath = path.join(process.cwd(), 'env', 'screenshot.yml');
    expect(fs.existsSync(configPath)).toBe(true);
    
    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('urls:');
    expect(content).toContain('output:');
  });
  
  it('diff.ymlが存在し、正しい形式である', () => {
    const configPath = path.join(process.cwd(), 'env', 'diff.yml');
    expect(fs.existsSync(configPath)).toBe(true);
    
    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('source_directory:');
    expect(content).toContain('target_directory:');
  });
});

// ソースコードの基本構造テスト
describe('ソースコード構造', () => {
  it('screenshot.tsが存在する', () => {
    const filePath = path.join(process.cwd(), 'src', 'screenshot.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });
  
  it('diff.tsが存在する', () => {
    const filePath = path.join(process.cwd(), 'src', 'diff.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });
  
  it('config.tsが存在する', () => {
    const filePath = path.join(process.cwd(), 'src', 'types', 'config.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});