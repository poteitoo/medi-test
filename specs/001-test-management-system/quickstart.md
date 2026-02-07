# クイックスタート: テストマネジメントシステム開発環境セットアップ

**対象**: 開発者
**前提**: Node.js 20+, pnpm, PostgreSQL 14+がインストール済み

---

## 1. リポジトリクローン

```bash
git clone https://github.com/your-org/medi-test.git
cd medi-test
git checkout 001-test-management-system
```

---

## 2. 依存関係インストール

```bash
pnpm install
```

---

## 3. 環境変数設定

`.env.local` ファイルを作成:

```bash
cp .env.example .env.local
```

`.env.local` を編集:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/medi_test_dev"

# Authentication (Supabase)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# External Integrations (Optional)
JIRA_URL="https://your-domain.atlassian.net"
JIRA_API_TOKEN="your-jira-token"
GITHUB_TOKEN="your-github-token"
LINEAR_API_KEY="your-linear-key"

# App
NODE_ENV="development"
PORT="5173"
```

---

## 4. PostgreSQLデータベースセットアップ

### 4.1 データベース作成

```bash
psql -U postgres
CREATE DATABASE medi_test_dev;
\q
```

### 4.2 Prismaスキーマ反映

`prisma/schema.prisma` に [data-model.md](./data-model.md) のスキーマを追加済みの想定で:

```bash
# マイグレーション作成
pnpm prisma migrate dev --name init

# Prisma Clientコード生成
pnpm prisma generate
```

### 4.3 初期データ投入 (Optional)

```bash
# シードスクリプト実行
pnpm prisma db seed
```

`prisma/seed.ts` の例:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Organization作成
  const org = await prisma.organization.create({
    data: {
      name: "サンプル組織",
      slug: "sample-org",
    },
  });

  // Project作成
  const project = await prisma.project.create({
    data: {
      organization_id: org.id,
      name: "サンプルプロジェクト",
      slug: "sample-project",
      description: "テスト用プロジェクト",
    },
  });

  // User作成
  const user = await prisma.user.create({
    data: {
      organization_id: org.id,
      email: "admin@example.com",
      name: "管理者",
    },
  });

  // Role割り当て
  await prisma.roleAssignment.create({
    data: {
      user_id: user.id,
      organization_id: org.id,
      role: "ADMIN",
    },
  });

  console.log({ org, project, user });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

---

## 5. 開発サーバー起動

```bash
pnpm dev
```

ブラウザで http://localhost:5173 を開く

---

## 6. 型チェック

```bash
# TypeScript型チェック (エラーがないことを確認)
npx tsc --noEmit

# React Router型生成
pnpm typecheck
```

---

## 7. コードフォーマット

```bash
# oxfmtでフォーマット
pnpm fmt
```

---

## 8. テスト実行

### 8.1 ユニットテスト

```bash
pnpm test
```

### 8.2 統合テスト (TestContainers使用)

```bash
pnpm test:integration
```

### 8.3 E2Eテスト (Playwright)

```bash
# Playwright初回セットアップ
npx playwright install

# E2Eテスト実行
pnpm test:e2e

# UIモードで実行 (デバッグ用)
pnpm test:e2e:ui
```

---

## 9. ディレクトリ構造確認

```
├── app/                      # React Router設定
│   ├── routes.ts
│   ├── root.tsx
│   └── app.css
├── presentation/             # Presentation層
│   ├── components/ui/        # Shadcn/ui components
│   ├── features/             # 機能モジュール (DDD構造)
│   │   ├── test-case-management/
│   │   │   ├── ui/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   └── infrastructure/
│   │   └── ...
│   ├── pages/                # Route-level components
│   └── lib/                  # 共有ユーティリティ
├── shared/                   # 共有ドメインロジック
│   ├── auth/
│   └── db/
├── prisma/
│   ├── schema.prisma         # Prismaスキーマ
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── specs/001-test-management-system/
    ├── spec.md
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── quickstart.md          # このファイル
    └── contracts/
```

---

## 10. 主要な開発フロー

### 10.1 新機能追加

1. `presentation/features/` に新機能ディレクトリ作成 (DDD構造)
2. `domain/models/` でドメインモデル定義 (Effect TS `Data.Class`)
3. `application/ports/` でPort定義 (Effect TS `Tag`)
4. `infrastructure/adapters/` でAdapter実装 (Effect TS `Layer`)
5. `ui/components/` でReactコンポーネント作成
6. `ui/adapters/` でEffect → React bridge実装
7. `app/routes.ts` でルート追加

### 10.2 Prismaスキーマ更新

1. `prisma/schema.prisma` を編集
2. `pnpm prisma migrate dev --name <migration-name>` でマイグレーション作成
3. `pnpm prisma generate` でPrisma Client再生成

### 10.3 テスト追加

1. `tests/unit/<feature>/` にユニットテスト配置
2. `tests/integration/<feature>/` に統合テスト配置
3. `tests/e2e/<feature>/` にE2Eテスト配置

---

## 11. トラブルシューティング

### PostgreSQL接続エラー

```bash
# PostgreSQL起動確認
pg_ctl status

# PostgreSQL起動
pg_ctl start
```

### Prismaマイグレーションエラー

```bash
# データベースリセット (開発環境のみ!)
pnpm prisma migrate reset

# 最新マイグレーション適用
pnpm prisma migrate deploy
```

### Effect TS型エラー

```bash
# Prisma Client再生成
pnpm prisma generate

# node_modules削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 12. 次のステップ

開発環境のセットアップが完了したら:

1. [spec.md](./spec.md) でユーザーストーリーと要件を確認
2. [data-model.md](./data-model.md) でデータモデルを理解
3. [contracts/openapi.yaml](./contracts/openapi.yaml) でAPI仕様を確認
4. CLAUDE.mdの実装ガイドを参照し、Constitution準拠のコードを記述

**重要**: コミット前に必ず以下を実行

```bash
npx tsc --noEmit        # 型エラーゼロ必須
pnpm typecheck          # React Router型生成
pnpm fmt                # フォーマット
```
