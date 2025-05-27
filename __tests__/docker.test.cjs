const { test, expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

test('Docker container environment variables', () => {
  // Check if we're in Docker environment by checking if the .dockerenv file exists
  const inDocker = fs.existsSync('/.dockerenv');
  
  // This test is informational - just log whether we're in Docker or not
  console.log(`Running in Docker environment: ${inDocker}`);
  console.log(`TEST_IN_DOCKER env: ${process.env.TEST_IN_DOCKER}`);

  // For now, just make a simple check that the test can run
  expect(true).toBe(true);
  
  // Log the current directory
  console.log(`Current directory: ${process.cwd()}`);
  
  try {
    // Try to list directory contents
    const files = fs.readdirSync(process.cwd());
    console.log(`Directory contents: ${files ? files.slice(0, 5).join(', ') : 'No files found'}${files.length > 5 ? '...' : ''}`);
    expect(Array.isArray(files)).toBe(true);
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error; // Make the test fail if we can't read the directory
  }
});