import { jest, describe, it, expect } from '@jest/globals';

// Mock puppeteer to avoid path errors
jest.mock('puppeteer', () => ({
  launch: jest.fn()
}));

import * as config from '../src/types/config.js';
import * as diffModule from '../src/diff.js';
import * as screenshotModule from '../src/screenshot.js';

// 関数のエクスポートテスト
describe('関数のエクスポート確認', () => {
  // 設定ファイル関連
  describe('config.ts', () => {
    it('loadConfig関数がエクスポートされている', () => {
      expect(typeof config.loadConfig).toBe('function');
    });
    
    it('loadDiffConfig関数がエクスポートされている', () => {
      expect(typeof config.loadDiffConfig).toBe('function');
    });
  });
  
  // diff.ts関連
  describe('diff.ts', () => {
    it('compareAndMergeImages関数がエクスポートされている', () => {
      expect(typeof diffModule.default.compareAndMergeImages).toBe('function');
    });
    
    it('writeLog関数がエクスポートされている', () => {
      expect(typeof diffModule.default.writeLog).toBe('function');
    });
    
    it('main関数がエクスポートされている', () => {
      expect(typeof diffModule.default.main).toBe('function');
    });
    
    it('デフォルトエクスポートがある', () => {
      expect(diffModule.default).toBeDefined();
      expect(typeof diffModule.default).toBe('object');
      expect(diffModule.default.compareAndMergeImages).toBeDefined();
      expect(diffModule.default.writeLog).toBeDefined();
      expect(diffModule.default.main).toBeDefined();
    });
  });
  
  // screenshot.ts関連
  describe('screenshot.ts', () => {
    it('takeScreenshot関数がエクスポートされている', () => {
      expect(typeof screenshotModule.default.takeScreenshot).toBe('function');
    });
    
    it('main関数がエクスポートされている', () => {
      expect(typeof screenshotModule.default.main).toBe('function');
    });
    
    it('デフォルトエクスポートがある', () => {
      expect(screenshotModule.default).toBeDefined();
      expect(typeof screenshotModule.default).toBe('object');
      expect(screenshotModule.default.takeScreenshot).toBeDefined();
      expect(screenshotModule.default.main).toBeDefined();
    });
  });
});