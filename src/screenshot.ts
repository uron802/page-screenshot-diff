import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import puppeteer from 'puppeteer';
import { ScreenshotConfig } from './types/config';

function loadConfig(): ScreenshotConfig {
  try {
    const configPath = path.join(process.cwd(), 'screenshot.yml');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const file = fs.readFileSync(configPath, 'utf8');
    const config = yaml.parse(file) as ScreenshotConfig;

    if (!config?.urls || !Array.isArray(config.urls)) {
      throw new Error('Invalid config: urls must be an array');
    }

    if (!config.output_directory) {
      throw new Error('Missing output_directory');
    }

    return config;
  } catch (error) {
    console.error('Config loading error:', error);
    throw error;
  }
}