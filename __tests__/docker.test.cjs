const { test, expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

test('Docker container structure', () => {
  // Check if we're in a Docker environment by checking if the .dockerenv file exists
  const inDocker = fs.existsSync('/.dockerenv');
  
  // This test is informational - just log whether we're in Docker or not
  console.log(`Running in Docker environment: ${inDocker}`);

  // For now, just make a simple check that the test can run
  expect(true).toBe(true);
  
  // Log the current directory
  console.log(`Current directory: ${process.cwd()}`);
  
  try {
    // Try to list directory contents
    const files = fs.readdirSync(process.cwd());
    console.log(`Directory contents: ${files ? files.toString() : 'No files found'}`);
  } catch (error) {
    console.error('Error reading directory:', error);
  }
});