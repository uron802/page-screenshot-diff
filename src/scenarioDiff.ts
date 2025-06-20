import { compareAndMergeImages } from './diff.js';
import * as fs from 'fs';
import * as path from 'path';

function gatherPngFiles(dir: string): string[] {
  const results: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current)) {
      const full = path.join(current, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        stack.push(full);
      } else if (entry.endsWith('.png')) {
        results.push(full);
      }
    }
  }
  return results;
}

export function diffScenario(oldDir: string, newDir: string, threshold = 0.1): boolean {
  let allMatch = true;
  const oldFiles = gatherPngFiles(oldDir);
  for (const oldFile of oldFiles) {
    const rel = path.relative(oldDir, oldFile);
    const newFile = path.join(newDir, rel);
    if (!fs.existsSync(newFile)) {
      console.log(`${rel}: 対応するファイルがありません`);
      allMatch = false;
      continue;
    }
    const result = compareAndMergeImages(oldFile, newFile, threshold);
    console.log(`${rel}: ${result.isMatch ? '一致' : '不一致'}`);
    if (!result.isMatch) {
      allMatch = false;
    }
  }
  return allMatch;
}

export function main() {
  const args = process.argv.slice(2);
  let oldDir = '';
  let newDir = '';
  let cliThreshold: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--old') {
      oldDir = args[++i];
    } else if (arg.startsWith('--old=')) {
      oldDir = arg.split('=')[1];
    } else if (arg === '--new') {
      newDir = args[++i];
    } else if (arg.startsWith('--new=')) {
      newDir = arg.split('=')[1];
    } else if (arg === '--threshold' || arg === '-t') {
      const value = args[i + 1];
      cliThreshold = value ? parseFloat(value) : undefined;
      i++;
    } else if (arg.startsWith('--threshold=')) {
      cliThreshold = parseFloat(arg.split('=')[1]);
    }
  }

  const threshold =
    cliThreshold !== undefined && !isNaN(cliThreshold) ? cliThreshold : 0.1;

  if (!oldDir || !newDir) {
    console.error(
      'Usage: node dist/scenarioDiff.js --old <oldDir> --new <newDir> [--threshold <value>]'
    );
    process.exit(1);
  }

  diffScenario(oldDir, newDir, threshold);
}

if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID && !process.env.TEST_IN_DOCKER) {
  main();
}

export default { diffScenario, main };
