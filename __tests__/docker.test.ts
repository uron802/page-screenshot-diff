import { jest, describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Docker tests', () => {
  it('Docker environment detection should work', () => {
    const inDocker = fs.existsSync('/.dockerenv');
    console.log(`Running in Docker environment: ${inDocker}`);
    // This test always passes - it's just for diagnostics
    expect(true).toBe(true);
  });
  
  it('File system access should work in Docker', () => {
    // Test actual file system operations
    const currentDir = process.cwd();
    console.log(`Current directory: ${currentDir}`);
    
    // List files in current directory
    const files = fs.readdirSync(currentDir);
    console.log(`Found files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
    
    // This should pass if fs is not mocked
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  it('Path module should work correctly', () => {
    const testPath = path.join('/test', 'directory', 'file.txt');
    expect(testPath).toBe('/test/directory/file.txt');
    
    const baseName = path.basename(testPath);
    expect(baseName).toBe('file.txt');
  });
});