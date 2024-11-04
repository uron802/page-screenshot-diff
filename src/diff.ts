import { loadDiffConfig } from './types/config.js';
import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

function compareAndMergeImages(imagePath1: string, imagePath2: string): {isMatch: boolean; mergedImagePath?: string} {
  try {
    const img1 = PNG.sync.read(fs.readFileSync(imagePath1));
    const img2 = PNG.sync.read(fs.readFileSync(imagePath2));

    const numDiffPixels = pixelmatch(img1.data, img2.data, null, img1.width, img1.height, {threshold: 0.1});
    
    if (numDiffPixels === 0) {
      return { isMatch: true };
    }
    
    const mergedImage = new PNG({
      width: img1.width * 2,
      height: img1.height
    });

    // 左側に1つ目の画像をコピー
    PNG.bitblt(img1, mergedImage, 0, 0, img1.width, img1.height, 0, 0);
    // 右側に2つ目の画像をコピー
    PNG.bitblt(img2, mergedImage, 0, 0, img2.width, img2.height, img1.width, 0);

    const diffDir = path.join(process.cwd(), 'output', 'diff');
    if (!fs.existsSync(diffDir)) {
      fs.mkdirSync(diffDir, { recursive: true });
    }
    
    const mergedImagePath = path.join(diffDir, path.basename(imagePath1));
    fs.writeFileSync(mergedImagePath, PNG.sync.write(mergedImage));
    
    return { isMatch: false, mergedImagePath };
    
  } catch (error) {
    console.error('画像比較エラー:', error);
    return { isMatch: false };
  }
}


function writeLog(message: string) {
  const logDir = path.join(process.cwd(), 'output', 'diff');
  const logPath = path.join(logDir, 'diff.log');
  
  // ディレクトリが無ければ作成
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // ログをファイルに追記
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
  // コンソールにも出力
  console.log(message);
}

function main() {
  try {
    const config = loadDiffConfig();
    const sourceDir = path.join(process.cwd(), 'output', config.source_directory);
    const targetDir = path.join(process.cwd(), 'output', config.target_directory);

    const sourceFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.png'));

    for (const file of sourceFiles) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      if (!fs.existsSync(targetPath)) {
        console.log(`対象ファイルが見つかりません: ${file}`);
        continue;
      }

      const result = compareAndMergeImages(sourcePath, targetPath);
      writeLog(`${file}: ${result.isMatch ? '一致' : '不一致'}`);
      if (!result.isMatch && result.mergedImagePath) {
        writeLog(`  比較画像: ${result.mergedImagePath}`);
      }
    }
  } catch (error) {
    writeLog(`エラー: ${error}`);
    process.exit(1);
  }
}

main();