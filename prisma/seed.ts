import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Organization作成
  const org = await prisma.organization.upsert({
    where: { slug: "sample-org" },
    update: {},
    create: {
      name: "サンプル組織",
      slug: "sample-org",
    },
  });
  console.log(`✓ Organization created: ${org.name}`);

  // Project作成
  const project = await prisma.project.upsert({
    where: { id: "sample-project-id" },
    update: {},
    create: {
      id: "sample-project-id",
      organization_id: org.id,
      name: "サンプルプロジェクト",
      slug: "sample-project",
      description: "テスト用プロジェクト",
    },
  });
  console.log(`✓ Project created: ${project.name}`);

  // User作成 (QA Manager)
  const qaManager = await prisma.user.upsert({
    where: { email: "qa-manager@example.com" },
    update: {},
    create: {
      organization_id: org.id,
      email: "qa-manager@example.com",
      name: "QA マネージャー",
      oidc_sub: "qa-manager-oidc-sub",
    },
  });
  console.log(`✓ User created: ${qaManager.name}`);

  // User作成 (QA Engineer)
  const qaEngineer = await prisma.user.upsert({
    where: { email: "qa-engineer@example.com" },
    update: {},
    create: {
      organization_id: org.id,
      email: "qa-engineer@example.com",
      name: "QA エンジニア",
      oidc_sub: "qa-engineer-oidc-sub",
    },
  });
  console.log(`✓ User created: ${qaEngineer.name}`);

  // User作成 (Developer)
  const developer = await prisma.user.upsert({
    where: { email: "developer@example.com" },
    update: {},
    create: {
      organization_id: org.id,
      email: "developer@example.com",
      name: "開発者",
      oidc_sub: "developer-oidc-sub",
    },
  });
  console.log(`✓ User created: ${developer.name}`);

  // User作成 (Admin)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      organization_id: org.id,
      email: "admin@example.com",
      name: "管理者",
      oidc_sub: "admin-oidc-sub",
    },
  });
  console.log(`✓ User created: ${admin.name}`);

  // Role割り当て - Admin
  await prisma.roleAssignment.upsert({
    where: {
      user_id_organization_id_project_id_role: {
        user_id: admin.id,
        organization_id: org.id,
        project_id: null,
        role: "ADMIN",
      },
    },
    update: {},
    create: {
      user_id: admin.id,
      organization_id: org.id,
      role: "ADMIN",
    },
  });
  console.log(`✓ Role assigned: ${admin.name} → ADMIN`);

  // Role割り当て - QA Manager
  await prisma.roleAssignment.upsert({
    where: {
      user_id_organization_id_project_id_role: {
        user_id: qaManager.id,
        organization_id: org.id,
        project_id: project.id,
        role: "QA_MANAGER",
      },
    },
    update: {},
    create: {
      user_id: qaManager.id,
      organization_id: org.id,
      project_id: project.id,
      role: "QA_MANAGER",
    },
  });
  console.log(`✓ Role assigned: ${qaManager.name} → QA_MANAGER`);

  // Role割り当て - QA Engineer
  await prisma.roleAssignment.upsert({
    where: {
      user_id_organization_id_project_id_role: {
        user_id: qaEngineer.id,
        organization_id: org.id,
        project_id: project.id,
        role: "QA_ENGINEER",
      },
    },
    update: {},
    create: {
      user_id: qaEngineer.id,
      organization_id: org.id,
      project_id: project.id,
      role: "QA_ENGINEER",
    },
  });
  console.log(`✓ Role assigned: ${qaEngineer.name} → QA_ENGINEER`);

  // Role割り当て - Developer
  await prisma.roleAssignment.upsert({
    where: {
      user_id_organization_id_project_id_role: {
        user_id: developer.id,
        organization_id: org.id,
        project_id: project.id,
        role: "DEVELOPER",
      },
    },
    update: {},
    create: {
      user_id: developer.id,
      organization_id: org.id,
      project_id: project.id,
      role: "DEVELOPER",
    },
  });
  console.log(`✓ Role assigned: ${developer.name} → DEVELOPER`);

  // サンプルテストケース作成
  const testCase = await prisma.testCase.create({
    data: {
      project_id: project.id,
      revisions: {
        create: {
          rev: 1,
          status: "APPROVED",
          title: "ログイン機能のテスト",
          content: {
            steps: [
              "ログイン画面を開く",
              "メールアドレスとパスワードを入力",
              "ログインボタンをクリック",
            ],
            expected_result: "ダッシュボードにリダイレクトされる",
            tags: ["認証", "重要"],
            priority: "HIGH",
            environment: "staging",
          },
          created_by: qaEngineer.id,
        },
      },
    },
  });
  console.log(`✓ Test case created: ログイン機能のテスト`);

  // サンプルリリース作成
  const release = await prisma.release.create({
    data: {
      project_id: project.id,
      name: "v1.0.0",
      description: "初回リリース",
      status: "PLANNING",
      build_ref: "abc123",
    },
  });
  console.log(`✓ Release created: ${release.name}`);

  console.log("\n✨ Seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
