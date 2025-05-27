// Jest setup for ESM
import { jest, describe as jestDescribe, it as jestIt, expect as jestExpect } from '@jest/globals';
import fs from 'fs';

// Make Jest functions globally available
global.jest = jest;
global.describe = jestDescribe;
global.it = jestIt;
global.expect = jestExpect;

// Check if we're in Docker or running specific tests that need real file system access
const inDocker = fs.existsSync('/.dockerenv');
const isDockerTest = process.env.TEST_IN_DOCKER === 'true' || inDocker;

// Only mock fs and path when not in Docker environment
if (!isDockerTest) {
  // Mock initialization code to avoid TypeScript errors for most unit tests
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
}
