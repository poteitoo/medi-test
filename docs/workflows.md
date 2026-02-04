# ワークフロー

## テストフロー（想定）

```mermaid
flowchart TD
  A["リリース候補を検出"] --> B["PRのリリースタグ確認"]
  B --> C["Linearから変更内容取得"]
  C --> D["影響範囲の分析"]
  D --> E["テスト範囲を自動提案"]
  E --> F["テストラン作成"]
  F --> G["担当割り当て"]
  G --> H["テスト実行"]
  H --> I["結果と証跡の入力"]
  I --> J["重要度別の合格判定"]
  J --> K["承認"]
  K --> L["レポート共有"]
```

## シナリオ管理

- シナリオを目的、前提条件、手順、期待結果で記述して登録
- 更新履歴を残し、過去の版を参照可能にする
- 使われなくなったシナリオはアーカイブして一覧を整理

## リリーステスト計画

- リリースやビルドごとにテストランを作成
- 対象シナリオを選定し、担当者と期限を設定
- 重要度と必須・任意で実行優先度を調整

## テスト実行と記録

- 実行者がシナリオごとに結果を記録
- 失敗時の再現手順、ログ、スクリーンショットを証跡として添付
- 進捗はリアルタイムで更新される

## 完了判定とレポート

- 重要度別の合格条件を満たすかを確認
- 未実施や失敗のシナリオを明示
- 結果レポートを共有し、監査や振り返りに活用

## テストケース作成までのプロセス

1. リリース内容の把握。PR のリリースタグと Linear 情報を収集し、変更点を整理する。ツールは関連 PR と Linear の一覧化や要約を支援できる。
2. 影響範囲の分析。変更箇所と影響ドメインを洗い出す。ツールは過去のシナリオとの関連付けや差分可視化を支援できる。
3. テスト観点の整理。重要度やリスクに応じて観点を洗い出す。ツールは観点テンプレートやチェックリストを提示できる。
4. シナリオとテストケースの設計。再利用可能な単位でケース化し、必須・任意を決める。ツールは重複検知と既存シナリオの推薦を支援できる。
5. レビューと承認。テスト内容の妥当性を確認する。ツールはレビュー依頼と承認ログの記録を支援できる。
6. テストランへの割り当て。リリース単位にまとめ、担当と期限を設定する。ツールは自動提案と一括割当を支援できる。

## このツールが支援できること

- PR と Linear を参照したテスト範囲の自動提案
- 既存シナリオの推薦と重複チェック
- 重要度と必須・任意の設定支援
- 証跡の一元管理と検索
- 進捗と完了条件の可視化

---

## シナリオのライフサイクル（Git操作）

### 新規シナリオ作成フロー

```mermaid
sequenceDiagram
  participant User as ユーザー
  participant UI as UI
  participant Backend as Backend
  participant Git as Git Repository

  User->>UI: シナリオ作成フォームを入力
  UI->>Backend: POST /api/scenarios
  Backend->>Backend: YAML + Markdown 生成
  Backend->>Backend: バリデーション（スキーマチェック）
  Backend->>Git: YAML + MD ファイルを作成
  Backend->>Git: git add + git commit
  Git-->>Backend: Commit SHA
  Backend->>Git: git push
  Backend-->>UI: 201 Created (scenario_id, version)
  UI->>User: 保存完了通知
```

**主なステップ**:

1. ユーザーがフォームで入力（タイトル、カテゴリ、手順など）
2. Backend が YAML と Markdown を生成
3. YAML スキーマバリデーション
4. Git リポジトリにファイルを作成
5. Commit + Push（commit SHA を取得）
6. UI にシナリオ ID と version を返す

### シナリオ更新フロー（バージョニング）

```mermaid
sequenceDiagram
  participant User as ユーザー
  participant UI as UI
  participant Backend as Backend
  participant Git as Git Repository

  User->>UI: シナリオ編集
  UI->>Backend: PUT /api/scenarios/:id (+ base_version)
  Backend->>Git: 現在の HEAD を確認

  alt Base version が古い（コンフリクト）
    Backend-->>UI: 409 Conflict
    UI->>User: 「シナリオが他のユーザーにより更新されています」
    User->>UI: 最新版を取得して再編集
  else Base version が最新
    Backend->>Git: YAML + MD ファイルを更新
    Backend->>Git: git commit -m "Update scenario: [id]"
    Git-->>Backend: 新しい Commit SHA
    Backend->>Git: git push
    Backend-->>UI: 200 OK (new_version)
    UI->>User: 保存完了通知
  end
```

**楽観的ロック（Optimistic Locking）**:

- 編集開始時に現在の commit SHA を取得（`base_version`）
- 保存時に `base_version` と現在の HEAD を比較
- 異なる場合は 409 Conflict を返し、ユーザーに再編集を促す

### シナリオアーカイブフロー

```mermaid
sequenceDiagram
  participant User as ユーザー
  participant UI as UI
  participant Backend as Backend
  participant Git as Git Repository

  User->>UI: シナリオをアーカイブ
  UI->>Backend: POST /api/scenarios/:id/archive
  Backend->>Git: ファイルを archived/ ディレクトリに移動
  Backend->>Git: git mv scenarios/auth/login-001.* archived/auth/
  Backend->>Git: git commit -m "Archive scenario: login-001"
  Backend->>Git: git push
  Backend-->>UI: 200 OK
  UI->>User: アーカイブ完了
```

**アーカイブ戦略**:

- ファイル削除ではなく、`archived/` ディレクトリに移動
- Git 履歴により、過去のテストランからは参照可能
- UI では active シナリオのみ表示（archived は非表示）

---

## テスト実行のリアルタイム更新フロー

```mermaid
sequenceDiagram
  participant Executor as Executor UI
  participant Backend as Backend
  participant DB as PostgreSQL
  participant SSE as SSE Manager<br/>(Effect Hub)
  participant Viewer1 as Viewer UI 1
  participant Viewer2 as Viewer UI 2

  Note over Viewer1,Viewer2: SSE 接続を開く
  Viewer1->>Backend: GET /api/test-runs/:id/stream
  Backend->>SSE: Subscribe to testRunId
  Viewer2->>Backend: GET /api/test-runs/:id/stream
  Backend->>SSE: Subscribe to testRunId

  Note over Executor: テスト結果を入力
  Executor->>Backend: PUT /api/test-runs/:id/items/:itemId
  Backend->>DB: UPDATE test_run_items
  DB-->>Backend: Updated
  Backend->>SSE: Publish (item_updated event)
  SSE-->>Viewer1: Push event
  SSE-->>Viewer2: Push event
  Backend-->>Executor: 200 OK

  Note over Viewer1,Viewer2: UI を自動更新
  Viewer1->>Viewer1: Update progress bar
  Viewer2->>Viewer2: Update test item status
```

**SSE イベント例**:

```json
{
  "type": "item_updated",
  "testRunId": "abc123",
  "itemId": "xyz789",
  "data": {
    "result": "success",
    "executedBy": "yamada@example.com",
    "executedAt": "2025-01-15T14:30:00Z"
  },
  "timestamp": "2025-01-15T14:30:01Z"
}
```

**詳細**: [リアルタイム更新](real-time-updates.md)

---

## テストラン作成から完了までの全体フロー

```mermaid
graph TD
  A[GitHub PR リリースタグ検出] --> B[Linear Issue 取得]
  B --> C[変更ファイル分析]
  C --> D[テスト範囲自動提案]
  D --> E[テストラン作成<br/>+ Git commit SHA 保存]
  E --> F[担当者割り当て]
  F --> G[Slack 通知: テストラン開始]

  G --> H[Executor がテスト実行]
  H --> I{結果は？}
  I -->|成功| J[PostgreSQL に保存]
  I -->|失敗| K[証跡を添付<br/>スクリーンショット + ログ]
  K --> J

  J --> L[SSE でブロードキャスト]
  L --> M[Viewer の UI が自動更新]

  M --> N{全テスト完了？}
  N -->|No| H
  N -->|Yes| O[重要度別の合格判定]

  O --> P{合格条件を満たす？}
  P -->|Yes| Q[ステータス: 承認待ち]
  P -->|No| R[ステータス: 失敗]

  Q --> S[Slack 通知: 承認依頼]
  S --> T[Approver が承認]
  T --> U[ステータス: 完了]

  U --> V[レポート生成<br/>HTML + CSV]
  V --> W[Slack 通知: テストラン完了]

  R --> X[再テスト or リリース延期]

  style E fill:#bbf
  style J fill:#bbf
  style L fill:#f9f
  style O fill:#fbb
  style V fill:#bfb
```

---

## 承認フロー

```mermaid
sequenceDiagram
  participant Executor as Executor
  participant System as System
  participant Approver as Approver
  participant Slack as Slack

  Note over Executor: すべてのテストを実行
  Executor->>System: 最後のテスト結果を入力
  System->>System: 重要度別の合格条件を確認

  alt 合格条件を満たす
    System->>System: ステータスを "承認待ち" に更新
    System->>Slack: 承認依頼通知
    Slack-->>Approver: 通知受信
    Approver->>System: テストラン詳細を確認
    Approver->>System: 承認 or 差し戻し

    alt 承認
      System->>System: ステータスを "完了" に更新
      System->>Slack: 完了通知
    else 差し戻し
      System->>System: ステータスを "in_progress" に戻す
      System->>Slack: 差し戻し通知
      Slack-->>Executor: 再テスト依頼
    end
  else 合格条件を満たさない
    System->>System: ステータスを "失敗" に更新
    System->>Slack: 失敗通知
    Slack-->>Executor: 再テスト依頼
  end
```

---

## エラー処理とリトライ

### テスト実行中のエラー

```mermaid
graph TD
  A[テスト実行] --> B{結果は？}
  B -->|成功| C[success]
  B -->|失敗| D[fail + 証跡添付]
  B -->|ブロック| E[blocked<br/>前提条件が満たせない]
  B -->|スキップ| F[skipped<br/>意図的にスキップ]

  D --> G{再テスト？}
  G -->|Yes| A
  G -->|No| H[失敗として記録]

  E --> I[ブロック要因を解決]
  I --> J{解決した？}
  J -->|Yes| A
  J -->|No| K[ブロックとして記録]

  style C fill:#bfb
  style D fill:#fbb
  style E fill:#fdb
  style F fill:#ddd
```

---

## 関連ドキュメント

- [ストレージアーキテクチャ](storage-architecture.md) - Git リポジトリ構造の詳細
- [リアルタイム更新](real-time-updates.md) - SSE 実装の詳細
- [外部連携](integrations.md) - GitHub、Linear、Slack の統合
- [データモデル](data-model.md) - エンティティとリレーションシップ
