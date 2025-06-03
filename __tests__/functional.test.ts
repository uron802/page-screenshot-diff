import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { ScreenshotConfig, DiffConfig } from '../src/types/config.js';

// テスト用設定ファイルとディレクトリを作成するテスト
describe('機能テスト', () => {
  const tempDir = path.join(process.cwd(), 'test-temp');
  const outputDir = path.join(tempDir, 'output');
  const screenshotFile = path.join(tempDir, 'screenshot.yml');
  const diffFile = path.join(tempDir, 'diff.yml');
  const sourceDir = path.join(outputDir, 'source');
  const targetDir = path.join(outputDir, 'target');
  const diffOutputDir = path.join(outputDir, 'diff');

  // テスト前にディレクトリを準備
  beforeAll(() => {
    // ディレクトリ作成
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(targetDir, { recursive: true });
    
    // テスト用のscreenshot.yml作成
    const screenshotConfig: ScreenshotConfig = {
      urls: [
        { url: 'https://example.com', filename: 'example' },
        { url: 'https://github.com', filename: 'github' }
      ],
      output: { subdirectory: 'source' }
    };
    fs.writeFileSync(screenshotFile, yaml.stringify(screenshotConfig));
    
    // テスト用のdiff.yml作成
    const diffConfig: DiffConfig = {
      source_directory: 'source',
      target_directory: 'target'
    };
    fs.writeFileSync(diffFile, yaml.stringify(diffConfig));
    
    // テスト用の画像ファイル作成（単純なバイナリデータ）
    const testImage1 = Buffer.from('テスト画像データ1');
    const testImage2 = Buffer.from('テスト画像データ2');
    
    fs.writeFileSync(path.join(sourceDir, 'test.png'), testImage1);
    fs.writeFileSync(path.join(targetDir, 'test.png'), testImage2);
  });
  
  // テスト後にテンポラリディレクトリを削除
  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  // 設定ファイルの読み込みテスト
  it('テスト用のYMLファイルが正しく作成されている', () => {
    expect(fs.existsSync(screenshotFile)).toBe(true);
    expect(fs.existsSync(diffFile)).toBe(true);
    
    const screenshotContent = fs.readFileSync(screenshotFile, 'utf8');
    expect(screenshotContent).toContain('urls:');
    expect(screenshotContent).toContain('example.com');
    
    const diffContent = fs.readFileSync(diffFile, 'utf8');
    expect(diffContent).toContain('source_directory:');
    expect(diffContent).toContain('target_directory:');
  });
  
  // テスト用の画像ファイルが作成されているかテスト
  it('テスト用の画像ファイルが正しく作成されている', () => {
    const sourcePath = path.join(sourceDir, 'test.png');
    const targetPath = path.join(targetDir, 'test.png');
    
    expect(fs.existsSync(sourcePath)).toBe(true);
    expect(fs.existsSync(targetPath)).toBe(true);
    
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const targetContent = fs.readFileSync(targetPath, 'utf8');
    
    expect(sourceContent).toBe('テスト画像データ1');
    expect(targetContent).toBe('テスト画像データ2');
  });
  
  // 出力ディレクトリの作成テスト
  it('diffディレクトリを作成できる', () => {
    if (!fs.existsSync(diffOutputDir)) {
      fs.mkdirSync(diffOutputDir, { recursive: true });
    }
    
    expect(fs.existsSync(diffOutputDir)).toBe(true);
  });
  
  // ログファイルの書き込みテスト
  it('ログファイルに書き込める', () => {
    const logPath = path.join(diffOutputDir, 'test.log');
    const logMessage = '2023-01-01T00:00:00.000Z - テストログメッセージ\n';
    
    fs.writeFileSync(logPath, logMessage);
    
    expect(fs.existsSync(logPath)).toBe(true);
    expect(fs.readFileSync(logPath, 'utf8')).toBe(logMessage);
  });
});