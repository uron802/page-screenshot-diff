import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { loadDiffConfig } from '../src/types/config.js';

// モックのインポート
jest.mock('fs');
jest.mock('path');
jest.mock('pngjs');
jest.mock('pixelmatch');
jest.mock('../src/types/config.js');

// diffモジュールをインポート
const diffModule = await import('../src/diff.js');

describe('Diff functionality', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // process.cwdのモック
    jest.spyOn(process, 'cwd').mockReturnValue('/test');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.basename as jest.Mock).mockImplementation((filePath) => filePath.split('/').pop());
  });

  describe('compareAndMergeImages', () => {
    it('同一の画像の場合は一致と判定される', () => {
      // PNGモック
      const mockImg1 = { width: 100, height: 100, data: Buffer.from('img1') };
      const mockImg2 = { width: 100, height: 100, data: Buffer.from('img2') };
      
      PNG.sync.read = jest.fn()
        .mockReturnValueOnce(mockImg1)
        .mockReturnValueOnce(mockImg2);
      
      // pixelmatchは0（差分なし）を返す
      (pixelmatch as jest.Mock).mockReturnValue(0);
      
      const result = diffModule.default.compareAndMergeImages('/test/img1.png', '/test/img2.png');
      
      expect(PNG.sync.read).toHaveBeenCalledTimes(2);
      expect(pixelmatch).toHaveBeenCalledWith(
        mockImg1.data, mockImg2.data, null, mockImg1.width, mockImg1.height, {threshold: 0.1}
      );
      expect(result).toEqual({ isMatch: true });
    });
    
    it('異なる画像の場合は差分画像が生成される', () => {
      // PNGモック
      const mockImg1 = { width: 100, height: 100, data: Buffer.from('img1') };
      const mockImg2 = { width: 100, height: 100, data: Buffer.from('img2') };
      const mockMergedImage = { width: 200, height: 100 };
      
      PNG.sync.read = jest.fn()
        .mockReturnValueOnce(mockImg1)
        .mockReturnValueOnce(mockImg2);
      
      // コンストラクタモック
      PNG.mockImplementation(() => mockMergedImage);
      
      // ビットブリットモック
      PNG.bitblt = jest.fn();
      
      // pixelmatchは差分を返す
      (pixelmatch as jest.Mock).mockReturnValue(100);
      
      // ディレクトリチェック
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      
      // ファイル書き込みモック
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      PNG.sync.write = jest.fn().mockReturnValue(Buffer.from('merged'));
      
      const result = diffModule.default.compareAndMergeImages('/test/img1.png', '/test/img2.png');
      
      expect(PNG.sync.read).toHaveBeenCalledTimes(2);
      expect(pixelmatch).toHaveBeenCalledWith(
        mockImg1.data, mockImg2.data, null, mockImg1.width, mockImg1.height, {threshold: 0.1}
      );
      
      // ディレクトリ作成確認
      expect(fs.existsSync).toHaveBeenCalledWith('/test/output/diff');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/output/diff', { recursive: true });
      
      // 画像合成確認
      expect(PNG.bitblt).toHaveBeenCalledTimes(2);
      
      // ファイル書き込み確認
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/output/diff/img1.png',
        expect.anything()
      );
      
      expect(result).toEqual({ 
        isMatch: false,
        mergedImagePath: '/test/output/diff/img1.png'
      });
    });
    
    it('エラー発生時は適切に処理される', () => {
      // エラーをシミュレート
      PNG.sync.read = jest.fn().mockImplementation(() => {
        throw new Error('PNG read error');
      });
      
      const result = diffModule.default.compareAndMergeImages('/test/img1.png', '/test/img2.png');
      
      expect(console.error).toHaveBeenCalledWith('画像比較エラー:', expect.any(Error));
      expect(result).toEqual({ isMatch: false });
    });
  });
  
  describe('writeLog', () => {
    it('ログファイルに正しく書き込まれる', () => {
      // 日付モック
      const mockDate = new Date('2023-01-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      // ディレクトリチェック
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      
      // ファイル書き込みモック
      (fs.appendFileSync as jest.Mock).mockReturnValue(undefined);
      
      diffModule.default.writeLog('テストメッセージ');
      
      // ディレクトリ作成確認
      expect(fs.existsSync).toHaveBeenCalledWith('/test/output/diff');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/output/diff', { recursive: true });
      
      // ログ書き込み確認
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/test/output/diff/diff.log',
        '2023-01-01T12:00:00.000Z - テストメッセージ\n'
      );
      
      // コンソール出力確認
      expect(console.log).toHaveBeenCalledWith('テストメッセージ');
    });
  });
  
  describe('main', () => {
    it('指定されたディレクトリの画像を比較する', () => {
      // 設定モック
      const mockConfig = {
        source_directory: 'source',
        target_directory: 'target'
      };
      (loadDiffConfig as jest.Mock).mockReturnValue(mockConfig);
      
      // ファイル一覧モック
      (fs.readdirSync as jest.Mock).mockReturnValue(['image1.png', 'image2.png', 'notpng.txt']);
      
      // ファイル存在チェック
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // compareAndMergeImagesモック
      const compareAndMergeImagesSpy = jest.spyOn(diffModule.default, 'compareAndMergeImages')
        .mockReturnValueOnce({ isMatch: true })
        .mockReturnValueOnce({ isMatch: false, mergedImagePath: '/test/output/diff/image2.png' });
      
      // writeLogモック
      const writeLogSpy = jest.spyOn(diffModule.default, 'writeLog').mockImplementation(() => {});
      
      // main関数実行
      diffModule.default.main();
      
      // 設定読み込み確認
      expect(loadDiffConfig).toHaveBeenCalled();
      
      // ディレクトリからPNGファイルのみ読み込み確認
      expect(fs.readdirSync).toHaveBeenCalledWith('/test/output/source');
      
      // 各画像で比較実行確認
      expect(compareAndMergeImagesSpy).toHaveBeenCalledTimes(2);
      expect(compareAndMergeImagesSpy).toHaveBeenCalledWith(
        '/test/output/source/image1.png',
        '/test/output/target/image1.png'
      );
      expect(compareAndMergeImagesSpy).toHaveBeenCalledWith(
        '/test/output/source/image2.png',
        '/test/output/target/image2.png'
      );
      
      // ログ出力確認
      expect(writeLogSpy).toHaveBeenCalledTimes(3);
      expect(writeLogSpy).toHaveBeenCalledWith('image1.png: 一致');
      expect(writeLogSpy).toHaveBeenCalledWith('image2.png: 不一致');
      expect(writeLogSpy).toHaveBeenCalledWith('  比較画像: /test/output/diff/image2.png');
    });
    
    it('対象ファイルが存在しない場合はスキップする', () => {
      // 設定モック
      const mockConfig = {
        source_directory: 'source',
        target_directory: 'target'
      };
      (loadDiffConfig as jest.Mock).mockReturnValue(mockConfig);
      
      // ファイル一覧モック
      (fs.readdirSync as jest.Mock).mockReturnValue(['image1.png']);
      
      // ファイル存在チェック - 対象ファイルなし
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // main関数実行
      diffModule.default.main();
      
      // コンソール出力確認
      expect(console.log).toHaveBeenCalledWith('対象ファイルが見つかりません: image1.png');
    });
  });
});