import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { compareAndMergeImages } from '../src/diff.js';

describe('compareAndMergeImages with different sized images', () => {
  let tempDir: string;
  let img1Path: string;
  let img2Path: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-diff-'));
    img1Path = path.join(tempDir, 'img1.png');
    img2Path = path.join(tempDir, 'img2.png');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function createTestImage(width: number, height: number, red: number, green: number, blue: number): PNG {
    const png = new PNG({ width, height });
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        png.data[idx] = red;     // red
        png.data[idx + 1] = green; // green
        png.data[idx + 2] = blue;  // blue
        png.data[idx + 3] = 255;   // alpha
      }
    }
    return png;
  }

  it('should handle images with different widths', () => {
    // Create images with different widths but same height
    const img1 = createTestImage(100, 50, 255, 0, 0); // red, 100x50
    const img2 = createTestImage(150, 50, 0, 255, 0); // green, 150x50
    
    fs.writeFileSync(img1Path, PNG.sync.write(img1));
    fs.writeFileSync(img2Path, PNG.sync.write(img2));

    // This should not throw an error
    const result = compareAndMergeImages(img1Path, img2Path, 0.1);
    expect(result.isMatch).toBe(false);
    expect(result.mergedImagePath).toBeDefined();
    
    // Verify the merged image exists and can be read
    if (result.mergedImagePath) {
      expect(fs.existsSync(result.mergedImagePath)).toBe(true);
      const mergedImage = PNG.sync.read(fs.readFileSync(result.mergedImagePath));
      expect(mergedImage.width).toBe(250); // 100 + 150
      expect(mergedImage.height).toBe(50);  // max(50, 50)
    }
  });

  it('should handle images with different heights', () => {
    // Create images with same width but different heights
    const img1 = createTestImage(100, 50, 255, 0, 0);  // red, 100x50
    const img2 = createTestImage(100, 100, 0, 255, 0); // green, 100x100
    
    fs.writeFileSync(img1Path, PNG.sync.write(img1));
    fs.writeFileSync(img2Path, PNG.sync.write(img2));

    // This should not throw an error
    const result = compareAndMergeImages(img1Path, img2Path, 0.1);
    expect(result.isMatch).toBe(false);
    expect(result.mergedImagePath).toBeDefined();
    
    // Verify the merged image exists and can be read
    if (result.mergedImagePath) {
      expect(fs.existsSync(result.mergedImagePath)).toBe(true);
      const mergedImage = PNG.sync.read(fs.readFileSync(result.mergedImagePath));
      expect(mergedImage.width).toBe(200); // 100 + 100
      expect(mergedImage.height).toBe(100); // max(50, 100)
    }
  });

  it('should handle images with different widths and heights', () => {
    // Create images with completely different dimensions
    const img1 = createTestImage(80, 60, 255, 0, 0);   // red, 80x60
    const img2 = createTestImage(120, 40, 0, 255, 0);  // green, 120x40
    
    fs.writeFileSync(img1Path, PNG.sync.write(img1));
    fs.writeFileSync(img2Path, PNG.sync.write(img2));

    // This should not throw an error
    const result = compareAndMergeImages(img1Path, img2Path, 0.1);
    expect(result.isMatch).toBe(false);
    expect(result.mergedImagePath).toBeDefined();
    
    // Verify the merged image exists and can be read
    if (result.mergedImagePath) {
      expect(fs.existsSync(result.mergedImagePath)).toBe(true);
      const mergedImage = PNG.sync.read(fs.readFileSync(result.mergedImagePath));
      expect(mergedImage.width).toBe(200); // 80 + 120
      expect(mergedImage.height).toBe(60); // max(60, 40)
    }
  });

  // Test that same-sized images still work correctly
  it('should still work correctly with same-sized images', () => {
    // Create identical images
    const img1 = createTestImage(100, 50, 255, 0, 0); // red, 100x50
    const img2 = createTestImage(100, 50, 255, 0, 0); // red, 100x50 (identical)
    
    fs.writeFileSync(img1Path, PNG.sync.write(img1));
    fs.writeFileSync(img2Path, PNG.sync.write(img2));

    const result = compareAndMergeImages(img1Path, img2Path, 0.1);
    expect(result.isMatch).toBe(true);
    expect(result.mergedImagePath).toBeUndefined();
  });

  it('should detect differences in same-sized images', () => {
    // Create different images of same size
    const img1 = createTestImage(100, 50, 255, 0, 0); // red, 100x50
    const img2 = createTestImage(100, 50, 0, 255, 0); // green, 100x50
    
    fs.writeFileSync(img1Path, PNG.sync.write(img1));
    fs.writeFileSync(img2Path, PNG.sync.write(img2));

    const result = compareAndMergeImages(img1Path, img2Path, 0.1);
    expect(result.isMatch).toBe(false);
    expect(result.mergedImagePath).toBeDefined();
    
    // Verify the merged image exists and can be read
    if (result.mergedImagePath) {
      expect(fs.existsSync(result.mergedImagePath)).toBe(true);
      const mergedImage = PNG.sync.read(fs.readFileSync(result.mergedImagePath));
      expect(mergedImage.width).toBe(200); // 100 + 100
      expect(mergedImage.height).toBe(50); // max(50, 50)
    }
  });
});