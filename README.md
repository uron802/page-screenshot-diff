# page-screenshot-diff

Webページのスクリーンショットを撮影し、画像の差分を比較するツール

このプロジェクトはGitHub Copilotの支援を受けて開発されました。AIアシスタントの協力に感謝いたします。

## 環境構築
### コンテナ作成
```
docker-compose build
docker-compose up -d
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
docker-compose exec app node dist/screenshot.js
```

### シナリオに沿ったスクリーンショット
YMLで定義したシナリオとCSVのパラメータを組み合わせてアクションごとに画面を保存します。

```bash
docker-compose exec app node dist/scenario.js --scenario env/scenario.yml --params env/params.csv --output output/run1
```

`--output` (または `-o`) オプションで保存先ディレクトリを指定します。

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
    screenshot: step3
  - action: wait
    wait: 1000 # ミリ秒
    screenshot: step4
```

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
| `click` | `selector` | `timeout`, `screenshot` | CSSセレクタで指定した要素をクリックします。遷移を伴う場合`timeout`で待ち時間を上書きできます |
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

