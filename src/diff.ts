import { loadDiffConfig } from './types/config.js'; 
import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

async function compareImages(imagePath1: string, imagePath2: string): Promise<boolean> {
  try {
    const pixelmatch = (await import('pixelmatch')).default;
    const img1 = PNG.sync.read(fs.readFileSync(imagePath1));
    const img2 = PNG.sync.read(fs.readFileSync(imagePath2));
    
    if (img1.width !== img2.width || img1.height !== img2.height) {
      console.log(`Size mismatch for ${path.basename(imagePath1)}`);
      return false;
    }

    const diff = new PNG({width: img1.width, height: img1.height});
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {threshold: 0.1});
    
    return numDiffPixels === 0;
  } catch (error) {
    console.error('Error comparing images:', error);
    return false;
  }
}

async function main() {
  try {
    const config = loadDiffConfig();
    const sourceDir = path.join(process.cwd(), 'output', config.source_directory);
    const targetDir = path.join(process.cwd(), 'output', config.target_directory);

    const sourceFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.png'));

    for (const file of sourceFiles) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      if (!fs.existsSync(targetPath)) {
        console.log(`File not found in target directory: ${file}`);
        continue;
      }

      const isMatch = await compareImages(sourcePath, targetPath);
      console.log(`${file}: ${isMatch ? 'Match' : 'Different'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();