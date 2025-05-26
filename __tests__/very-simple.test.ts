import { jest, describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Very simple test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
  
  it('can use built-in modules', () => {
    expect(typeof fs.readFileSync).toBe('function');
    expect(typeof path.join).toBe('function');
  });
});