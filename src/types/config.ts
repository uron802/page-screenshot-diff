import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

// スクリーンショット設定の型
export interface ScreenshotConfig {
  urls: {
    url: string;
    filename: string;
  }[];
  output: {
    subdirectory: string;
  };
}

// 比較設定の型
export interface DiffConfig {
  source_directory: string;
  target_directory: string;
}

// 設定ファイル読み込み関数
export function loadConfig(): ScreenshotConfig {
  try {
    const configPath = path.join(process.cwd(), 'screenshot.yml');
    const file = fs.readFileSync(configPath, 'utf8');
    const config = yaml.parse(file) as ScreenshotConfig;
    
    if (!config || !config.output || !config.output.subdirectory || !Array.isArray(config.urls)) {
      throw new Error('Invalid config format');
    }
    
    return config;
  } catch (error) {
    console.error('Config loading error:', error);
    process.exit(1);
  }
}

export function loadDiffConfig(): DiffConfig {
  try {
    const configPath = path.join(process.cwd(), 'diff.yml');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const file = fs.readFileSync(configPath, 'utf8');
    const config = yaml.parse(file) as DiffConfig;

    if (!config?.source_directory || !config?.target_directory) {
      throw new Error('Invalid config: source_directory and target_directory are required');
    }

    return config;
  } catch (error) {
    console.error('Config loading error:', error);
    throw error;
  }
}