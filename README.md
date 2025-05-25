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
```

## コマンド実行
### スクリーンショットの撮影

```
docker-compose exec app node dist/screenshot.js
```

### 画像の差分比較
```
docker-compose exec app node dist/diff.js
```

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

#### 特定のテストファイルのみ実行（例：ビルドテスト）
```
docker-compose exec app npm test -- build.test.ts
```