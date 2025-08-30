# page-screenshot-diff

TypeScript、Node.js、Puppeteerで構築されたウェブページのスクリーンショット取得と画像差分比較ツール。ウェブページのスクリーンショットを生成し、画像を比較してビジュアルな差分を検出します。

まずこの指示書を参照し、ここにある情報と一致しない予期しない情報に遭遇した場合のみ、検索やbashコマンドにフォールバックしてください。

## 効果的な作業方法

### ブートストラップとビルド
- 依存関係のインストール: `PUPPETEER_SKIP_DOWNLOAD=1 npm install` -- 4秒かかります。ネットワーク制限によりChromeダウンロードが失敗するため、このフラグを使用してください。
- プロジェクトのビルド: `npm run build` -- 2秒かかります。絶対にキャンセルしないでください。`src/`から`dist/`へTypeScriptをコンパイルします。
- ビルドは非常に高速で、常に5秒以内に完了します。

### テスト
- **フルテストスイート**: `npm test` -- 10秒かかります。絶対にキャンセルしないでください。タイムアウトを30秒以上に設定してください。
- **シンプルテストスイート**: `npm run test:simple` -- 6秒かかります。基本機能テストを実行します。
- **基本テスト**: `npm run test:basic` -- 1秒かかります。TypeScriptなしのCommonJSテストです。
- **Dockerテスト**: 利用可能ですが、Docker環境の設定が必要です。

### アプリケーションコマンド
**前提条件**: PuppeteerのChromeダウンロードが無効になっているため、ローカルで実行する際は`PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`（またはシステムのChromePath）を設定してください。

- **スクリーンショット取得**: `node dist/screenshot.js [--concurrency 3] [--device "iPhone 13"]`
- **画像比較**: `node dist/diff.js [--threshold 0.2]`
- **シナリオ実行**: `node dist/scenario.js --scenario env/scenario.yml --params env/params.csv --output output/run1 [--headless false] [--concurrency 2]`
- **シナリオ結果比較**: `node dist/scenarioDiff.js --old output/run1 --new output/run2 [--threshold 0.2]`

## Docker環境

### Dockerビルドとセットアップ
- **コンテナビルド**: `docker compose build` -- 2分以上かかります。絶対にキャンセルしないでください。タイムアウトを180秒以上に設定してください。
- **コンテナ起動**: `docker compose up -d`
- **注意**: TypeScriptが本番依存関係で利用できないため、現在Dockerビルドが失敗します。DockerfileはプロダクションDependenciesのみをインストールしますが、ビルドにはTypeScriptが必要です。

### Dockerテストコマンド
- **フルテスト**: `docker compose exec app npm test`
- **シンプルテスト**: `docker compose exec app npm run test:simple`
- **特定テスト**: `docker compose exec app npm test -- build.test.ts`

### Dockerアプリケーションコマンド
- **スクリーンショット**: `docker compose exec app node dist/screenshot.js`
- **画像差分**: `docker compose exec app node dist/diff.js`
- **シナリオ**: `docker compose exec app node dist/scenario.js --scenario env/scenario.yml --params env/params.csv --output output/run1`

## 検証

### 必要な環境設定
- **Node.js 20**: ESMサポートとJest設定に必要です。
- **Chromium/Chrome**: Puppeteerに必要です。システムのChromePathに`PUPPETEER_EXECUTABLE_PATH`を設定してください。
- **Docker**: オプションですが、本番環境に近い環境として推奨されます。

### 手動テストワークフロー
1. **ビルド検証**: `npm run build`を実行し、.jsファイルとともに`dist/`ディレクトリが作成されることを確認します。
2. **テスト検証**: `npm run test:simple`を実行してコア機能を検証します。
3. **アプリケーションテスト**: `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser node dist/screenshot.js`を実行し、スクリーンショット取得を試行することを確認します（ネットワーク制限により失敗する可能性があります）。
4. **Dockerテスト**: `docker compose build`を実行し、コンテナが正常にビルドされることを確認します（現在失敗します - この制限を文書化してください）。

### CI/CD統合
- `.github/workflows/test.yml`のGitHub Actionsワークフローは、システムChromiumでテストを実行します。
- CI互換性を確保するため、コミット前に必ず`npm test`を実行してください。

## プロジェクト構造

### ソースコード (`src/`)
- `screenshot.ts` - Puppeteerを使用したメインスクリーンショット取得機能
- `diff.ts` - pixelmatchとPNGJSを使用した画像比較
- `scenario.ts` - YAML設定でのシナリオベーススクリーンショット取得
- `scenarioDiff.ts` - シナリオ実行結果の比較
- `types/config.ts` - 設定タイプ定義とローダー

### 設定ファイル
- `package.json` - ESMタイプとJestスクリプトを持つNPM設定
- `tsconfig.json` - ESNextモジュールでES2020をターゲットとするTypeScript設定
- `jest.config.js` - カスタムセットアップでESMサポートするJest設定
- `docker-compose.yml` - ボリュームマウントを持つDockerサービス定義
- `Dockerfile` - Puppeteer依存関係を持つマルチステージビルド（ビルドの問題があります）

### 環境設定 (`env/`)
- `screenshot.yml` - スクリーンショット用のURLリストと出力設定
- `diff.yml` - ソース/ターゲットディレクトリとしきい値設定
- シナリオテスト用の`scenario.yml`と`params.csv`を作成

### テスト構造 (`__tests__/`)
- 全モジュールをカバーする包括的なテストスイート
- TypeScript (.test.ts) とCommonJS (.test.cjs) テストの混在
- CI互換性のためのモックPuppeteer
- Docker環境検出とテスト

## 既知の問題と制限

### ネットワークとChromeインストール
- **PuppeteerのChromeダウンロードが失敗**: ネットワーク制限のため。必ず`PUPPETEER_SKIP_DOWNLOAD=1`フラグを使用してください。
- **システムChromeが必要**: システムChrome場所に`PUPPETEER_EXECUTABLE_PATH`を設定してください。
- **ネットワークリクエストが失敗**: サンドボックス環境では - 外部URLアクセス時にアプリケーションがエラーになる可能性があります。

### Docker制限
- **Dockerビルドが失敗**: TypeScriptがdevDependenciesにありますが、本番コンテナのビルドステップで必要です。
- **回避策**: DockerfileをdevDependenciesインストールするか、TypeScriptをdependenciesに移動するよう修正してください。

### CI/CD互換性
- テストはシステムChromiumでGitHub Actionsにパスします。
- ローカルテストはChromePath用の環境変数設定が必要です。

## 共通コマンドリファレンス

### リポジトリルートディレクトリリスト
```
.git/
.github/
.gitignore
Dockerfile
README.md
__mocks__/
__tests__/
docker-compose.yml
env/
jest.config.js
package-lock.json
package.json
src/
tsconfig.json
```

### ビルド出力 (`npm run build`後の`dist/`)
```
diff.js
scenario.js
scenarioDiff.js
screenshot.js
types/
```

### package.jsonキースクリプト
```json
{
  "build": "tsc",
  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
  "test:simple": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js simple.test.ts exports.test.ts functional.test.ts build.test.ts",
  "test:basic": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js basic.test.cjs docker.test.cjs"
}
```

## クイックスタートチェックリスト
- [ ] `PUPPETEER_SKIP_DOWNLOAD=1 npm install`を実行
- [ ] `npm run build`を実行
- [ ] セットアップ確認のため`npm run test:simple`を実行
- [ ] スクリーンショット機能のため`PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`を設定
- [ ] `node dist/screenshot.js`でテスト（ネットワーク制限により失敗する可能性がありますが、Chrome起動が表示されるはずです）