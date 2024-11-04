import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { DiffConfig } from './types/config';

function loadConfig(): DiffConfig {
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