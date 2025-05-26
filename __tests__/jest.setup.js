// Jest setup for ESM
import { jest, describe as jestDescribe, it as jestIt, expect as jestExpect } from '@jest/globals';

// Make Jest functions globally available
global.jest = jest;
global.describe = jestDescribe;
global.it = jestIt;
global.expect = jestExpect;

// Mock initialization code to avoid TypeScript errors
jest.mock('fs');
jest.mock('path', () => ({
  join: jest.fn((...parts) => parts.join('/')),
  basename: jest.fn(filepath => {
    const parts = String(filepath).split('/');
    return parts[parts.length - 1];
  }),
  dirname: jest.fn(path => {
    const parts = String(path).split('/');
    parts.pop();
    return parts.join('/') || '/';
  }),
  extname: jest.fn(path => {
    const parts = String(path).split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }),
  resolve: jest.fn((...parts) => parts.join('/'))
}));
