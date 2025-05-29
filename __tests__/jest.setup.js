// Jest setup for ESM
import { jest, describe as jestDescribe, it as jestIt, expect as jestExpect, beforeEach as jestBeforeEach, afterEach as jestAfterEach } from '@jest/globals';
import fs from 'fs';

// Make Jest functions globally available first
global.jest = jest;
global.describe = jestDescribe;
global.it = jestIt;
global.expect = jestExpect;
global.beforeEach = jestBeforeEach;
global.afterEach = jestAfterEach;

// Check if we're in Docker or running specific tests that need real file system access
const inDocker = fs.existsSync('/.dockerenv');
const isDockerTest = process.env.TEST_IN_DOCKER === 'true' || inDocker;

console.log(`Running in Docker environment: ${isDockerTest ? 'YES' : 'NO'}`);

// Expose the environment flag for tests to check
global.__isDockerEnvironment__ = isDockerTest;
