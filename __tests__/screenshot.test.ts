import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { loadConfig } from '../src/types/config.js';

// モックのインポート
jest.mock('fs');
jest.mock('path');
jest.mock('puppeteer');
jest.mock('../src/types/config.js');

// takeScreenshot関数をテストするためにモジュールをインポート
const screenshotModule = await import('../src/screenshot.js');

describe('Screenshot functionality', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // process.cwdのモック
    jest.spyOn(process, 'cwd').mockReturnValue('/test');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  describe('takeScreenshot', () => {
    it('スクリーンショットを正常に撮影できる', async () => {
      // Puppeteerのモック設定
      const mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        screenshot: jest.fn().mockResolvedValue(undefined)
      };
      
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined)
      };
      
      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
      
      // takeScreenshot関数の実行
      await screenshotModule.default.takeScreenshot('https://example.com', '/test/output/example.png');
      
      // 関数が期待通り呼び出されたかチェック
      expect(puppeteer.launch).toHaveBeenCalledWith({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      expect(mockPage.screenshot).toHaveBeenCalledWith({ 
        path: '/test/output/example.png',
        fullPage: true
      });
      expect(mockBrowser.close).toHaveBeenCalled();
    });
    
    it('エラー発生時に適切に処理される', async () => {
      // Puppeteerのエラーをシミュレート
      const mockError = new Error('Browser launch error');
      (puppeteer.launch as jest.Mock).mockRejectedValue(mockError);
      
      // エラーが投げられることを確認
      await expect(screenshotModule.default.takeScreenshot('https://example.com', '/test/output/example.png'))
        .rejects.toThrow('Browser launch error');
      
      // エラーログが出力されることを確認
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('main', () => {
    it('設定から全てのURLのスクリーンショットを撮影する', async () => {
      // 設定モック
      const mockConfig = {
        urls: [
          { url: 'https://example.com', filename: 'example' },
          { url: 'https://github.com', filename: 'github' }
        ],
        output: { subdirectory: 'new' }
      };
      (loadConfig as jest.Mock).mockReturnValue(mockConfig);
      
      // ディレクトリチェック
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      
      // takeScreenshotモック（内部実装をスキップ）
      const takeScreenshotSpy = jest.spyOn(screenshotModule.default, 'takeScreenshot')
        .mockResolvedValue(undefined);
      
      // main関数実行
      await screenshotModule.default.main();
      
      // ディレクトリが作成されたことを確認
      expect(fs.existsSync).toHaveBeenCalledWith('/test/output/new');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/output/new', { recursive: true });
      
      // 各URLでスクリーンショットが撮影されたことを確認
      expect(takeScreenshotSpy).toHaveBeenCalledTimes(2);
      expect(takeScreenshotSpy).toHaveBeenCalledWith('https://example.com', '/test/output/new/example.png');
      expect(takeScreenshotSpy).toHaveBeenCalledWith('https://github.com', '/test/output/new/github.png');
    });
    
    it('特定のURLでエラーが発生しても他のURLの処理を継続する', async () => {
      // 設定モック
      const mockConfig = {
        urls: [
          { url: 'https://example.com', filename: 'example' },
          { url: 'https://error-site.com', filename: 'error' },
          { url: 'https://github.com', filename: 'github' }
        ],
        output: { subdirectory: 'new' }
      };
      (loadConfig as jest.Mock).mockReturnValue(mockConfig);
      
      // ディレクトリ存在チェック
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // takeScreenshotモック（2番目のURLでエラー）
      const takeScreenshotSpy = jest.spyOn(screenshotModule.default, 'takeScreenshot')
        .mockImplementation((url) => {
          if (url === 'https://error-site.com') {
            return Promise.reject(new Error('Screenshot failed'));
          }
          return Promise.resolve();
        });
      
      // main関数実行
      await screenshotModule.default.main();
      
      // 3つのURLに対して処理が試行され、2つが成功することを確認
      expect(takeScreenshotSpy).toHaveBeenCalledTimes(3);
      expect(console.error).toHaveBeenCalledWith('Failed to capture https://error-site.com:', expect.any(Error));
    });
  });
});