import { loadConfig, loadDiffConfig } from '../src/types/config.js';
import * as fs from 'fs';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// モックのインポート
jest.mock('../src/types/config.js');

describe('Config loading', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // モック化したprocess.cwdの戻り値を設定
    jest.spyOn(process, 'cwd').mockReturnValue('/test');
  });

  describe('loadConfig', () => {
    it('正しい設定ファイルを読み込むことができる', () => {
      // モックデータを設定
      const mockConfigData = `
urls:
  - url: https://example.com
    filename: example
  - url: https://github.com
    filename: github
output:
  subdirectory: new
`;
      (fs.readFileSync as jest.Mock).mockReturnValue(mockConfigData);

      const config = loadConfig();

      expect(fs.readFileSync).toHaveBeenCalledWith('/test/screenshot.yml', 'utf8');
      expect(config).toEqual({
        urls: [
          { url: 'https://example.com', filename: 'example' },
          { url: 'https://github.com', filename: 'github' }
        ],
        output: { subdirectory: 'new' }
      });
    });

    it('設定ファイルが無効な場合はエラーを投げる', () => {
      // プロセス終了をモックする
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`Process exit with code ${code}`); });
      console.error = jest.fn();

      // 無効な形式の設定ファイル
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid: yaml');

      expect(() => {
        loadConfig();
      }).toThrow();

      expect(console.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('loadDiffConfig', () => {
    it('正しい設定ファイルを読み込むことができる', () => {
      // モックデータを設定
      const mockConfigData = `
source_directory: old
target_directory: new
`;
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockConfigData);

      const config = loadDiffConfig();

      expect(fs.existsSync).toHaveBeenCalledWith('/test/diff.yml');
      expect(fs.readFileSync).toHaveBeenCalledWith('/test/diff.yml', 'utf8');
      expect(config).toEqual({
        source_directory: 'old',
        target_directory: 'new'
      });
    });

    it('設定ファイルが存在しない場合はエラーを投げる', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => {
        loadDiffConfig();
      }).toThrow('Config file not found: /test/diff.yml');
    });

    it('必須フィールドがない場合はエラーを投げる', () => {
      // 必須フィールドがない無効な設定ファイル
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('other_field: value');

      expect(() => {
        loadDiffConfig();
      }).toThrow('Invalid config: source_directory and target_directory are required');
    });
  });
});
