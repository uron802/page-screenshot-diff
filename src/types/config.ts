// スクリーンショット設定の型
export interface ScreenshotConfig {
  urls: {
    url: string;
    filename: string;
  }[];
  output_directory: string;
}

// 比較設定の型
export interface DiffConfig {
  source_directory: string;
  target_directory: string;
}