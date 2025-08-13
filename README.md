# page-screenshot-diff

Webページのスクリーンショットを撮影し、画像の差分を比較するツール

このプロジェクトはGitHub Copilotの支援を受けて開発されました。AIアシスタントの協力に感謝いたします。

## 環境構築
### コンテナ作成
```
docker-compose build
docker-compose up -d
```

### 依存ライブラリのインストール
Docker イメージ作成時に `npm install` と `npm run build` を自動で実行するため、
ローカルで `node_modules` や `dist` を準備する必要はありません。
`docker-compose exec app node dist/...` などのコマンドは、コンテナ内で作成された
`dist` ディレクトリを利用するため、ローカルに `dist` がなくても実行できます。
以前は `TEST_IN_DOCKER` 環境変数によりスクリプトが自動実行されない問題がありま
したが、現在はデフォルトでこの変数を設定していないため、上記コマンドだけで実
行できます。
Chrome のダウンロードを省略したいなど、ローカルでテストを実行する場合のみ以下
のコマンドを実行してください。
```bash
PUPPETEER_SKIP_DOWNLOAD=1 npm install
```

### 設定
`env/screenshot.yml`:
```
urls:
  - url: https://example.com
    filename: example
  - url: https://github.com
    filename: github
output:
  subdirectory: new # 出力先のOutputサブディレクトリ
```

`env/diff.yml`:
```
source_directory: new
target_directory: old
threshold: 0.1 # 実行時オプションで変更可
```

## コマンド実行
### スクリーンショットの撮影

```
docker-compose exec app node dist/screenshot.js [--concurrency 3] [--device "iPhone 13"]
```
`--concurrency` (または `-c`) で同時に実行するリクエスト数を指定できます。省略時は1件ずつ順番に処理します。
`--device` で [Puppeteer が提供する端末名](https://pptr.dev/api/puppeteer.knownDevices) を指定すると、
該当端末の設定をエミュレートしてスクリーンショットを撮影します。

### シナリオに沿ったスクリーンショット
YMLで定義したシナリオとCSVのパラメータを組み合わせてアクションごとに画面を保存します。

```bash
docker-compose exec app node dist/scenario.js --scenario env/scenario.yml --params env/params.csv --output output/run1 [--headless false] [--concurrency 2]
```

`--output` (または `-o`) オプションで保存先ディレクトリを指定します。
`--headless` に `false` を指定するとブラウザを表示したまま実行できます。
`--concurrency` (または `-c`) を指定すると、同時に実行するシナリオ数を制御できます。
実行中は各アクションの結果が順次コンソールに表示されます。

`scenario.yml`例:
```yaml
defaultTimeout: 10000
actions:
  - action: goto
    url: https://example.com/login
    screenshot: step1
  - action: type
    selector: '#user'
    text: '${username}'
    screenshot: step2
  - action: click
    selector: '#login'
    wait: 500 # スクリーンショット前に待機
    screenshot: step3
  - action: wait
    wait: 1000 # ミリ秒
    screenshot: false
```

`screenshot` に `false` を指定すると、そのアクションではスクリーンショットを撮影しません。
文字列を指定するとファイル名として利用し、`true` または省略した場合はデフォルト名で保存します。

`params.csv`例 (複数列も利用できます):
```
username,age
testuser1,20
testuser2,30
```

`screenshot` オプションを省略した場合、スクリーンショットは `行番号-アクション番号.png`
の形式で保存されます。（例: `1-1.png`）

#### アクション一覧

| action | 必須オプション | その他のオプション | 説明 |
| ------ | ------------- | ------------------ | ---- |
| `goto` | `url` | `timeout`, `screenshot` | 指定したURLへ遷移します |
| `click` | `selector` | `timeout`, `wait`, `screenshot` | CSSセレクタで指定した要素をクリックします。`wait`を指定するとクリック後にそのミリ秒分待ってからスクリーンショットを撮ります。遷移を伴う場合`timeout`で待ち時間を上書きできます |
| `type` | `selector`, `text` | `screenshot` | テキストを入力します。`${変数}`でCSVの値を利用できます |
| `wait` | `wait` | `screenshot` | 指定ミリ秒だけ待機します |

### 画像の差分比較
```
docker-compose exec app node dist/diff.js [--threshold 0.2]
```
`--threshold` オプションを指定すると、実行時に比較の閾値を上書きできます。

### シナリオ結果の差分比較
過去と新しい実行結果のディレクトリを指定して比較を行います。
```
docker-compose exec app node dist/scenarioDiff.js --old output/run1 --new output/run2 [--threshold 0.2]
```
同名ファイルを比較し、`一致` または `不一致` を表示します。
`--old` と `--new` にはシナリオ実行時に `--output` で指定したディレクトリを指定します。
`--threshold` (または `-t`) オプションで差分判定の閾値を指定できます。

## テスト実行

テストを実行するには、以下のコマンドを使用します。

### ローカル環境でのテスト実行

#### 全テスト実行
```
npm test
```

#### シンプルテスト実行
機能検証のための基本的なテストのみ実行します。
```
npm run test:simple
```

#### ビルドテスト
```
npm test -- build.test.ts
```

### Docker環境でのテスト実行

Docker環境内でもテストを実行できます。以下の方法があります。

#### Docker内でコマンド直接実行
```
docker-compose exec app npm test               # 全テスト実行
docker-compose exec app npm run test:simple    # シンプルテスト実行
docker-compose exec app npm test -- <テストファイル名>  # 特定のテストファイル実行
```

#### ローカルから簡単に実行（ショートカットコマンド）
```
npm run test:docker           # 全テスト実行
npm run test:docker:simple    # シンプルテスト実行
```

#### 最小限の基本テスト実行（TypeScriptなし）
Node.jsの基本機能のみでテストを実行します。環境問題のトラブルシューティングに役立ちます。
```
npm run test:basic
```

#### 特定のテストファイルのみ実行（例：ビルドテスト）
```
docker-compose exec app npm test -- build.test.ts
```

