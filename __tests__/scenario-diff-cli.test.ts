import { describe, it, expect, beforeAll } from '@jest/globals';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execFileAsync = promisify(execFile);

const srcScript = path.join(process.cwd(), 'src', 'scenarioDiff.ts');

// ts-nodeを利用して直接実行するためビルドは不要
beforeAll(async () => {
  // 依存解決のためにnode_modulesが存在することだけ確認
  if (!fs.existsSync('node_modules')) {
    await execFileAsync('npm', ['ci']);
  }
}, 30000);

describe('scenarioDiff CLI integration', () => {
  it('指定ディレクトリが存在しない場合エラー表示のみを行う', async () => {
    const { stdout, stderr } = await execFileAsync('node', [
      '--loader',
      'ts-node/esm',
      srcScript,
      '--old',
      'missing1',
      '--new',
      'missing2'
    ], {
      encoding: 'utf8',
      env: { ...process.env, JEST_WORKER_ID: undefined, NODE_ENV: 'production' }
    });
    const output = (stdout || '') + (stderr || '');
    expect(output).toContain('ディレクトリが存在しません: missing1');
    expect(output).not.toContain('output/old');
  });
});
