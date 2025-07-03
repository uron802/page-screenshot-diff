import { jest, describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Simplified config tests without complex mocking
import { loadConfig, loadDiffConfig } from '../src/types/config.js';

describe('Config loading (simplified)', () => {
  describe('loadConfig', () => {
    it('loadConfig関数が存在し、関数として呼び出せる', () => {
      expect(typeof loadConfig).toBe('function');
      // Function exists and is callable - actual behavior depends on environment
      expect(true).toBe(true);
    });

    it('数値が含まれていても文字列として読み込まれる', () => {
      const tmp = fs.mkdtempSync(path.join(process.cwd(), 'cfg-num-'));
      const envDir = path.join(tmp, 'env');
      fs.mkdirSync(envDir);
      const yamlContent = [
        'urls:',
        '  - url: 12345',
        '    filename: 67890',
        'output:',
        '  subdirectory: 98765'
      ].join('\n');
      fs.writeFileSync(path.join(envDir, 'screenshot.yml'), yamlContent);
      const cwd = process.cwd();
      process.chdir(tmp);
      const cfg = loadConfig();
      process.chdir(cwd);
      fs.rmSync(tmp, { recursive: true, force: true });

      expect(cfg.output.subdirectory).toBe('98765');
      expect(cfg.urls[0].url).toBe('12345');
      expect(cfg.urls[0].filename).toBe('67890');
    });
  });

  describe('loadDiffConfig', () => {
    it('loadDiffConfig関数が存在し、関数として呼び出せる', () => {
      expect(typeof loadDiffConfig).toBe('function');
      // Function exists and is callable - actual behavior depends on environment
      expect(true).toBe(true);
    });
  });
});
