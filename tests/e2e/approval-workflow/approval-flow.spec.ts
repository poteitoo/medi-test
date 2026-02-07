import { test, expect } from "@playwright/test";

/**
 * Approval Workflow E2E Tests
 *
 * Tests the complete approval workflow for test case revisions:
 * 1. QA Engineer creates/edits test case (DRAFT)
 * 2. QA Engineer submits for review (IN_REVIEW)
 * 3. QA Manager approves or rejects
 * 4. Status updates accordingly (APPROVED/REJECTED)
 */

test.describe("Approval Workflow", () => {
  test.describe("As QA Engineer", () => {
    test.beforeEach(async ({ page }) => {
      // Login as QA Engineer
      await page.goto("/login");
      await page.fill('input[name="email"]', "qa-engineer@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL("/");
    });

    test("should create test case in DRAFT status", async ({ page }) => {
      await page.goto("/test-cases");
      await page.click('button:has-text("新規作成")');

      // Create test case
      await page.fill('input[placeholder*="タイトル"]', "承認フローテスト");
      await page.click('button:has-text("ステップを追加")');
      await page.fill('textarea[placeholder*="ステップ1"]', "テストステップ");
      await page.fill('textarea[placeholder*="期待結果"]', "期待結果");
      await page.click('button[type="submit"]:has-text("作成")');

      // Verify DRAFT status
      await expect(page.locator('text="下書き"')).toBeVisible();
      await expect(
        page.locator('button:has-text("レビューに提出")'),
      ).toBeEnabled();
    });

    test("should submit test case for review", async ({ page }) => {
      // Assume test case exists in DRAFT
      await page.goto("/test-cases/draft-case-id");

      // Verify current status
      await expect(page.locator('text="下書き"')).toBeVisible();

      // Submit for review
      await page.click('button:has-text("レビューに提出")');

      // Confirm submission dialog
      await page.click('button:has-text("確認"):last-of-type');

      // Verify status changed
      await expect(page.locator('text="承認待ち"')).toBeVisible();

      // Verify submit button is now disabled
      await expect(
        page.locator('button:has-text("レビューに提出")'),
      ).toBeDisabled();
    });

    test("should not submit test case with validation errors", async ({
      page,
    }) => {
      await page.goto("/test-cases");
      await page.click('button:has-text("新規作成")');

      // Create incomplete test case
      await page.fill('input[placeholder*="タイトル"]', "不完全なテストケース");
      // Don't add steps
      await page.fill('textarea[placeholder*="期待結果"]', "期待結果");
      await page.click('button[type="submit"]:has-text("作成")');

      // Verify validation error
      await expect(
        page.locator('text="テストステップを入力してください"'),
      ).toBeVisible();
    });

    test("should edit DRAFT revision after rejection", async ({ page }) => {
      // Assume test case was rejected
      await page.goto("/test-cases/rejected-case-id");

      // Verify rejected status
      await expect(page.locator('text="却下"')).toBeVisible();

      // Click edit
      await page.click('button:has-text("編集")');

      // Make changes
      const titleInput = page.locator('input[placeholder*="タイトル"]');
      await titleInput.fill("");
      await titleInput.fill("修正後のテストケース");

      // Save creates new draft revision
      await page.click('button[type="submit"]:has-text("保存")');

      // Verify new draft revision
      await expect(page.locator('text="下書き"')).toBeVisible();
      await expect(page.locator('text="リビジョン"')).toContainText("2");
    });
  });

  test.describe("As QA Manager", () => {
    test.beforeEach(async ({ page }) => {
      // Login as QA Manager
      await page.goto("/login");
      await page.fill('input[name="email"]', "qa-manager@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL("/");
    });

    test("should see approval panel for pending revisions", async ({
      page,
    }) => {
      // Navigate to test case with IN_REVIEW status
      await page.goto("/test-cases/pending-case-id");

      // Verify approval panel is visible
      await expect(page.locator('[data-testid="approval-panel"]')).toBeVisible();
      await expect(page.locator('button:has-text("承認")')).toBeEnabled();
      await expect(page.locator('button:has-text("却下")')).toBeEnabled();
    });

    test("should approve test case revision", async ({ page }) => {
      await page.goto("/test-cases/pending-case-id");

      // Verify pending status
      await expect(page.locator('text="承認待ち"')).toBeVisible();

      // Add approval comment (optional)
      await page.fill(
        'textarea[placeholder*="コメント"]',
        "内容を確認しました。承認します。",
      );

      // Click approve
      await page.click('button:has-text("承認")');

      // Confirm approval
      await page.click('button:has-text("確認"):last-of-type');

      // Verify status changed to APPROVED
      await expect(page.locator('text="承認済み"')).toBeVisible();

      // Verify approval info is displayed
      await expect(page.locator('text="承認者"')).toBeVisible();
      await expect(
        page.locator('text="内容を確認しました。承認します。"'),
      ).toBeVisible();

      // Verify approval panel is no longer visible
      await expect(
        page.locator('[data-testid="approval-panel"]'),
      ).not.toBeVisible();
    });

    test("should reject test case revision with required comment", async ({
      page,
    }) => {
      await page.goto("/test-cases/pending-case-id");

      // Try to reject without comment
      await page.click('button:has-text("却下")');

      // Verify comment is required
      await expect(
        page.locator('text="却下時にはコメントが必要です"'),
      ).toBeVisible();

      // Add rejection comment
      await page.fill(
        'textarea[placeholder*="コメント"]',
        "テストステップが不十分です。ステップ2と3を詳細化してください。",
      );

      // Click reject
      await page.click('button:has-text("却下")');

      // Confirm rejection
      await page.click('button:has-text("確認"):last-of-type');

      // Verify status changed to REJECTED
      await expect(page.locator('text="却下"')).toBeVisible();

      // Verify rejection comment is displayed
      await expect(
        page.locator(
          'text="テストステップが不十分です。ステップ2と3を詳細化してください。"',
        ),
      ).toBeVisible();
    });

    test("should not see approval panel for DRAFT revisions", async ({
      page,
    }) => {
      await page.goto("/test-cases/draft-case-id");

      // Verify DRAFT status
      await expect(page.locator('text="下書き"')).toBeVisible();

      // Verify approval panel is NOT visible
      await expect(
        page.locator('[data-testid="approval-panel"]'),
      ).not.toBeVisible();
    });

    test("should not see approval panel for already APPROVED revisions", async ({
      page,
    }) => {
      await page.goto("/test-cases/approved-case-id");

      // Verify APPROVED status
      await expect(page.locator('text="承認済み"')).toBeVisible();

      // Verify approval panel is NOT visible
      await expect(
        page.locator('[data-testid="approval-panel"]'),
      ).not.toBeVisible();
    });

    test("should filter test cases by approval status", async ({ page }) => {
      await page.goto("/test-cases");

      // Filter by pending approval
      await page.selectOption('select[name="status"]', "IN_REVIEW");

      // Verify only pending cases are shown
      await expect(page.locator('text="承認待ち"')).toHaveCount(
        await page.locator('[data-testid="test-case-card"]').count(),
      );
    });
  });

  test.describe("Approval History", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[name="email"]', "qa-engineer@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL("/");
    });

    test("should display approval history in revision timeline", async ({
      page,
    }) => {
      await page.goto("/test-cases/approved-case-id");

      // Click history tab
      await page.click('button[role="tab"]:has-text("履歴")');

      // Verify approval events are shown
      await expect(page.locator('text="承認済み"')).toBeVisible();
      await expect(page.locator('text="承認者"')).toBeVisible();
      await expect(page.locator('text="承認日時"')).toBeVisible();
    });

    test("should display rejection history with comments", async ({ page }) => {
      await page.goto("/test-cases/rejected-case-id");

      // Click history tab
      await page.click('button[role="tab"]:has-text("履歴")');

      // Verify rejection event with comment
      await expect(page.locator('text="却下"')).toBeVisible();
      await expect(page.locator('text="却下者"')).toBeVisible();
      await expect(
        page.locator('text="テストステップが不十分です"'),
      ).toBeVisible();
    });

    test("should display multiple approval cycles for same test case", async ({
      page,
    }) => {
      await page.goto("/test-cases/multi-revision-case-id");

      // Click history tab
      await page.click('button[role="tab"]:has-text("履歴")');

      // Verify multiple revision entries
      const revisionEntries = await page.locator('[data-testid="revision-entry"]').count();
      expect(revisionEntries).toBeGreaterThan(1);

      // Verify each revision has status info
      await expect(
        page.locator('text="リビジョン 1"'),
      ).toBeVisible();
      await expect(
        page.locator('text="リビジョン 2"'),
      ).toBeVisible();
    });
  });

  test.describe("Permission-based Access", () => {
    test("QA Engineer should not see approval buttons", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[name="email"]', "qa-engineer@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');

      await page.goto("/test-cases/pending-case-id");

      // Verify approval buttons are NOT visible for QA Engineer
      await expect(
        page.locator('button:has-text("承認")'),
      ).not.toBeVisible();
      await expect(
        page.locator('button:has-text("却下")'),
      ).not.toBeVisible();
    });

    test("Developer should only have read access", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[name="email"]', "developer@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');

      await page.goto("/test-cases/pending-case-id");

      // Verify no edit/approval buttons
      await expect(page.locator('button:has-text("編集")')).not.toBeVisible();
      await expect(page.locator('button:has-text("承認")')).not.toBeVisible();
      await expect(page.locator('button:has-text("却下")')).not.toBeVisible();

      // But can view content
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe("Status Transition Validation", () => {
    test("should prevent invalid status transitions", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[name="email"]', "qa-manager@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');

      // Try to approve already approved case (should not be possible)
      await page.goto("/test-cases/approved-case-id");

      // Verify approval panel is not shown
      await expect(
        page.locator('[data-testid="approval-panel"]'),
      ).not.toBeVisible();
    });

    test("should allow PENDING → DRAFT transition (return to draft)", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.fill('input[name="email"]', "qa-engineer@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');

      await page.goto("/test-cases/pending-case-id");

      // Click "下書きに戻す" button
      await page.click('button:has-text("下書きに戻す")');
      await page.click('button:has-text("確認"):last-of-type');

      // Verify status changed back to DRAFT
      await expect(page.locator('text="下書き"')).toBeVisible();
    });
  });

  test.describe("Notification and Communication", () => {
    test("should display notification after submission", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[name="email"]', "qa-engineer@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');

      await page.goto("/test-cases/draft-case-id");

      // Submit for review
      await page.click('button:has-text("レビューに提出")');
      await page.click('button:has-text("確認"):last-of-type');

      // Verify toast notification
      await expect(
        page.locator('text="レビューに提出しました"'),
      ).toBeVisible();
    });

    test("should display notification after approval", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[name="email"]', "qa-manager@example.com");
      await page.fill('input[name="password"]', "password");
      await page.click('button[type="submit"]');

      await page.goto("/test-cases/pending-case-id");

      await page.fill('textarea[placeholder*="コメント"]', "承認します");
      await page.click('button:has-text("承認")');
      await page.click('button:has-text("確認"):last-of-type');

      // Verify success toast
      await expect(page.locator('text="承認しました"')).toBeVisible();
    });
  });
});
