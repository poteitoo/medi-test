# medi-test - Test Management System

medimo アプリケーション向けのテスト管理システムです。シナリオを Git で管理し、実行結果を PostgreSQL に保存することで、テストの「何を」「誰が」「いつ」「どの結果で」実施したかを追跡します。

## サービス概要

medi-test は、testmo のようなシナリオベースのテスト実行管理を提供します：

- **Git ベースのシナリオ管理** - YAML/Markdown ファイルでシナリオをバージョン管理
- **PostgreSQL でテスト実行結果を保存** - リアルタイム更新と複雑なクエリに対応
- **GitHub PR と Linear の連携** - リリース検出とテスト範囲の自動提案
- **リアルタイム進捗更新（SSE）** - 複数ユーザーが同時に進捗を確認可能
- **Slack 通知** - テストラン開始、完了、失敗時の通知
- **HTML/CSV レポート出力** - Web 表示とデータ分析用エクスポート
- **OAuth 2.0 / OIDC 認証** - ロールベースのアクセス制御
- **Docker デプロイ** - 独自サーバーでの運用

## 設計思想

medi-test は、テストドメインの複雑さを管理するために Effect TS とドメイン駆動設計（DDD）を採用しています。

- **型安全性**: TypeScript と Effect TS による完全な型推論とエラーハンドリング
- **テスタビリティ**: Port/Adapter パターンによる外部依存の分離により、モックやスタブが容易
- **拡張性**: レイヤードアーキテクチャによる疎結合な設計
- **保守性**: ドメインロジックと技術的関心事の明確な分離

### Why Effect TS?

Effect TS は、関数型プログラミングの強力な概念（不変性、合成可能性、参照透過性）を TypeScript で実現するライブラリです。medi-test では Effect TS を採用することで、以下のメリットを享受しています：

1. **依存性注入（DI）の簡潔さ**: Tag と Layer による型安全な DI システム
2. **エラーハンドリングの明示性**: Effect 型により、成功と失敗のパスが型レベルで表現される
3. **テストの容易さ**: Layer の差し替えによる柔軟なテスト環境の構築
4. **合成可能性**: Effect Program を組み合わせて複雑なロジックを構築

## 技術スタック

- **Frontend**: React Router v7, Effect TS, TypeScript, Tailwind CSS v4
- **Backend Storage**: Git (scenarios), PostgreSQL (test execution results)
- **Authentication**: OAuth 2.0 / OIDC
- **Real-time Updates**: SSE (Server-Sent Events)
- **Notifications**: Slack
- **Reports**: HTML (web display), CSV/Excel export
- **Deployment**: Docker + self-hosted server
- **Integrations**: GitHub (PR with custom labels), Linear (full information retrieval)
- **UI Components**: Shadcn/ui + Radix UI
- **Form Validation**: React Hook Form + Zod
- **Text Editor**: TipTap (rich text editor with voice input)

## クイックスタート

### 前提条件

- Node.js 22.x 以上
- pnpm 9.x 以上
- Docker (デプロイ時)
- Git リポジトリ（シナリオ保存用）
- PostgreSQL 14.x 以上

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

アプリケーションは `http://localhost:5173` で起動します。

### ビルド

```bash
# プロダクションビルド
pnpm build

# ビルドの実行
pnpm start
```

### 型チェックとフォーマット

```bash
# 型チェック（コミット前に必須）
npx tsc --noEmit

# React Router の型生成 + TypeScript チェック
pnpm typecheck

# コードフォーマット（oxfmt）
pnpm fmt
```

## ドキュメント

詳細なドキュメントは `docs/` ディレクトリ以下に配置されています。

### はじめに

- **[プロダクト概要](docs/product-overview.md)** - サービスの目的、ユーザーロール、主要機能
- **[ワークフロー](docs/workflows.md)** - テストフロー、シナリオ管理、テストケース作成プロセス

### アーキテクチャ

- **[アーキテクチャ概要](docs/architecture.md)** - レイヤードアーキテクチャ、Port/Adapter パターン、依存方向のルール
- **[ストレージ戦略](docs/storage-architecture.md)** - Git + PostgreSQL のハイブリッド構成、バージョニング戦略
- **[認証・認可](docs/authentication.md)** - OAuth 2.0 / OIDC フロー、ロールベースアクセス制御
- **[リアルタイム更新](docs/real-time-updates.md)** - SSE によるテスト進捗の配信
- **[外部連携](docs/integrations.md)** - GitHub、Linear、Slack の統合

### データ設計

- **[データモデル](docs/data-model.md)** - エンティティ定義、リレーションシップ、シナリオファイル形式
- **[ディレクトリ構造](docs/directory-structure.md)** - 各レイヤーの役割、ファイル配置ルール

### 実装ガイド

- **[Effect TS 入門](docs/effect-guide.md)** - Effect の基本概念、Tag と Layer の使い方
- **[実装ガイド](docs/implementation-guide.md)** - 各レイヤーの実装例とステップバイステップガイド
- **[コーディング規約](docs/coding-standards.md)** - 命名規則、依存関係のルール、Effect TS ベストプラクティス

### 機能ドキュメント

- **[レポート生成](docs/reports.md)** - HTML/CSV/Excel レポートの実装

### テスト

- **[テスト戦略](docs/testing.md)** - Unit/Integration/Component テストのガイド

## プロジェクト構造の概要

```
medi-test/
  presentation/    # UI層（features: ビジネスロジック、pages: ルーティング対象、components: 共通UI）
    features/      # 機能モジュール（テストドメイン固有のロジック）
      auth/        # 認証（ログインフォーム）
      text-editor/ # TipTap エディタ（音声入力統合）
      voice-input/ # 音声入力機能（完全な DDD 構造）
    pages/         # ルートレベルコンポーネント（薄く、機能を組み合わせる）
    components/ui/ # Shadcn/ui コンポーネント（純粋な表示、ロジックなし）
    lib/           # 共通ユーティリティ、Zod スキーマ
  app/             # React Router 設定
    routes.ts      # ルート定義
    root.tsx       # ルートレイアウト
    app.css        # Tailwind v4 グローバルスタイル
  docs/            # ドキュメント
  public/          # 静的ファイル
```

**依存フロー**:

```
pages/ → features/ → components/ui/ → lib/
```

- `pages/` は features を組み合わせ、React Router の actions/loaders を処理
- `features/` はビジネスロジックと状態管理を含む
- `components/ui/` は純粋な表示コンポーネント（ロジックなし）
- `lib/` はフレームワークに依存しないユーティリティ

**重要**: `components/ui/` は `features/` をインポート**できません**（一方向フロー）。

詳細は [ディレクトリ構造](docs/directory-structure.md) を参照してください。

## 主要な設計決定

### ハイブリッドストレージ戦略

medi-test は、データの特性に応じて Git と PostgreSQL を使い分けます：

| データ             | ストレージ          | 理由                                             |
| ------------------ | ------------------- | ------------------------------------------------ |
| **テストシナリオ** | Git (YAML/Markdown) | バージョン管理、監査証跡、レビュー、ブランチ戦略 |
| **テスト実行結果** | PostgreSQL          | リアルタイム更新、複雑なクエリ、トランザクション |

詳細は [ストレージ戦略](docs/storage-architecture.md) を参照してください。

### リアルタイム更新（SSE）

複数ユーザーがテスト実行の進捗をリアルタイムで共有するため、Server-Sent Events (SSE) を採用：

- サーバーからクライアントへの一方向通信（テスト進捗はサーバーが通知）
- 自動再接続機能
- WebSocket より実装がシンプル

詳細は [リアルタイム更新](docs/real-time-updates.md) を参照してください。

### 外部連携

GitHub PR と Linear を連携し、テスト範囲を自動提案：

1. **GitHub PR**: カスタムラベル（例: `release: v2.1.0`）でリリース候補を検出
2. **Linear**: Issue 情報、ラベル、優先度、関連 PR、変更ファイルを取得
3. **自動提案**: 変更ファイルに基づいて影響範囲を分析し、関連シナリオを推薦

詳細は [外部連携](docs/integrations.md) を参照してください。

## コントリビューション

このプロジェクトは medimo チームによって開発されています。開発に参加する場合は、以下のドキュメントを必ず確認してください：

1. [アーキテクチャドキュメント](docs/architecture.md)で設計思想を理解
2. [コーディング規約](docs/coding-standards.md)でルールを確認
3. [実装ガイド](docs/implementation-guide.md)で実装パターンを学習
4. **コミット前に `npx tsc --noEmit` を実行**（MUST PASS）

### コード品質チェックリスト

- [ ] `npx tsc --noEmit` が成功する（型エラーなし）
- [ ] `pnpm fmt` でフォーマット済み
- [ ] `any`、`let`、型アサーション（`as`）を使用していない
- [ ] パスエイリアス（`~/`、`@app/*`）を使用（相対インポートではない）
- [ ] UI テキストは日本語
- [ ] className の結合に `cn()` ユーティリティを使用

## ライセンス

このプロジェクトは medimo の内部プロジェクトです。
