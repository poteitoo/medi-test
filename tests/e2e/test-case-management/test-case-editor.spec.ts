import { test, expect } from "@playwright/test";

/**
 * TestCaseEditor E2E Tests
 *
 * Tests user workflows for creating and editing test cases
 */

test.describe("TestCaseEditor", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test cases page
    await page.goto("/test-cases");
  });

  test("should display test case creation form", async ({ page }) => {
    // Click "新規作成" button
    await page.click('button:has-text("新規作成")');

    // Verify form elements are visible
    await expect(page.locator('input[placeholder*="タイトル"]')).toBeVisible();
    await expect(
      page.locator('textarea[placeholder*="前提条件"]'),
    ).toBeVisible();
    await expect(
      page.locator('textarea[placeholder*="期待結果"]'),
    ).toBeVisible();
  });

  test("should create a new test case with basic information", async ({
    page,
  }) => {
    // Click "新規作成" button
    await page.click('button:has-text("新規作成")');

    // Fill in test case information
    await page.fill('input[placeholder*="タイトル"]', "ログイン機能のテスト");

    // Add test steps
    await page.click('button:has-text("ステップを追加")');
    await page.fill(
      'textarea[placeholder*="ステップ1"]',
      "ログイン画面を開く",
    );

    await page.click('button:has-text("ステップを追加")');
    await page.fill(
      'textarea[placeholder*="ステップ2"]',
      "正しいユーザー名とパスワードを入力",
    );

    await page.click('button:has-text("ステップを追加")');
    await page.fill('textarea[placeholder*="ステップ3"]', "ログインボタンをクリック");

    // Fill in expected result
    await page.fill(
      'textarea[placeholder*="期待結果"]',
      "ダッシュボード画面に遷移し、ユーザー名が表示される",
    );

    // Submit form
    await page.click('button[type="submit"]:has-text("作成")');

    // Verify success message or redirect
    await expect(page).toHaveURL(/\/test-cases\/[a-f0-9-]+/);
    await expect(
      page.locator('h1:has-text("ログイン機能のテスト")'),
    ).toBeVisible();
  });

  test("should create test case with preconditions and tags", async ({
    page,
  }) => {
    await page.click('button:has-text("新規作成")');

    // Fill basic info
    await page.fill('input[placeholder*="タイトル"]', "データ削除機能のテスト");

    // Add preconditions
    await page.fill(
      'textarea[placeholder*="前提条件"]',
      "テストデータが登録されていること",
    );

    // Add steps
    await page.click('button:has-text("ステップを追加")');
    await page.fill(
      'textarea[placeholder*="ステップ1"]',
      "削除対象のデータを選択",
    );

    await page.click('button:has-text("ステップを追加")');
    await page.fill('textarea[placeholder*="ステップ2"]', "削除ボタンをクリック");

    // Fill expected result
    await page.fill(
      'textarea[placeholder*="期待結果"]',
      "データが削除され、一覧から消えること",
    );

    // Add tags
    await page.click('button:has-text("タグを追加")');
    await page.fill('input[placeholder*="タグ"]', "削除");
    await page.keyboard.press("Enter");

    await page.fill('input[placeholder*="タグ"]', "重要");
    await page.keyboard.press("Enter");

    // Select priority
    await page.selectOption('select[name="priority"]', "HIGH");

    // Submit
    await page.click('button[type="submit"]:has-text("作成")');

    // Verify
    await expect(page).toHaveURL(/\/test-cases\/[a-f0-9-]+/);
    await expect(page.locator('text="削除"')).toBeVisible();
    await expect(page.locator('text="重要"')).toBeVisible();
    await expect(page.locator('text="高"')).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.click('button:has-text("新規作成")');

    // Try to submit without filling required fields
    await page.click('button[type="submit"]:has-text("作成")');

    // Verify validation errors
    await expect(
      page.locator('text="タイトルを入力してください"'),
    ).toBeVisible();
    await expect(
      page.locator('text="テストステップを入力してください"'),
    ).toBeVisible();
    await expect(
      page.locator('text="期待結果を入力してください"'),
    ).toBeVisible();
  });

  test("should edit existing test case by creating new revision", async ({
    page,
  }) => {
    // Assume there's an existing test case
    await page.goto("/test-cases/existing-case-id");

    // Click edit button
    await page.click('button:has-text("編集")');

    // Modify title
    const titleInput = page.locator('input[placeholder*="タイトル"]');
    await titleInput.fill("");
    await titleInput.fill("更新されたテストケース");

    // Add new step
    await page.click('button:has-text("ステップを追加")');
    await page.fill(
      'textarea[placeholder*="ステップ"]:last-of-type',
      "新しいステップ",
    );

    // Submit
    await page.click('button[type="submit"]:has-text("保存")');

    // Verify new revision was created
    await expect(page.locator('text="リビジョン 2"')).toBeVisible();
    await expect(page.locator('h1:has-text("更新されたテストケース")')).toBeVisible();
  });

  test("should reorder test steps using drag and drop", async ({ page }) => {
    await page.click('button:has-text("新規作成")');

    await page.fill('input[placeholder*="タイトル"]', "ステップ並び替えテスト");

    // Add multiple steps
    const steps = ["ステップ 1", "ステップ 2", "ステップ 3"];
    for (const step of steps) {
      await page.click('button:has-text("ステップを追加")');
      const textarea = page
        .locator('textarea[placeholder*="ステップ"]')
        .last();
      await textarea.fill(step);
    }

    // Drag step 3 to position 1
    const step3 = page.locator('text="ステップ 3"').locator("..");
    const step1 = page.locator('text="ステップ 1"').locator("..");

    await step3.dragTo(step1);

    // Verify order changed
    const stepTexts = await page
      .locator('textarea[placeholder*="ステップ"]')
      .allTextContents();
    expect(stepTexts[0]).toContain("ステップ 3");
    expect(stepTexts[1]).toContain("ステップ 1");
    expect(stepTexts[2]).toContain("ステップ 2");
  });

  test("should remove test step", async ({ page }) => {
    await page.click('button:has-text("新規作成")');

    await page.fill('input[placeholder*="タイトル"]', "ステップ削除テスト");

    // Add steps
    await page.click('button:has-text("ステップを追加")');
    await page.fill('textarea[placeholder*="ステップ1"]', "削除されるステップ");

    await page.click('button:has-text("ステップを追加")');
    await page.fill('textarea[placeholder*="ステップ2"]', "残るステップ");

    // Remove first step
    await page.click('button[aria-label="ステップを削除"]:first-of-type');

    // Verify only one step remains
    const steps = await page
      .locator('textarea[placeholder*="ステップ"]')
      .count();
    expect(steps).toBe(1);

    const remainingText = await page
      .locator('textarea[placeholder*="ステップ"]')
      .textContent();
    expect(remainingText).toContain("残るステップ");
  });

  test("should display validation error for empty steps", async ({ page }) => {
    await page.click('button:has-text("新規作成")');

    await page.fill('input[placeholder*="タイトル"]', "バリデーションテスト");

    // Add step but leave it empty
    await page.click('button:has-text("ステップを追加")');

    await page.fill(
      'textarea[placeholder*="期待結果"]',
      "何か期待結果",
    );

    // Try to submit
    await page.click('button[type="submit"]:has-text("作成")');

    // Verify validation error
    await expect(
      page.locator('text="空のステップがあります"'),
    ).toBeVisible();
  });

  test("should cancel editing and discard changes", async ({ page }) => {
    await page.click('button:has-text("新規作成")');

    // Fill some data
    await page.fill('input[placeholder*="タイトル"]', "キャンセルテスト");
    await page.click('button:has-text("ステップを追加")');
    await page.fill('textarea[placeholder*="ステップ1"]', "破棄されるステップ");

    // Click cancel
    await page.click('button:has-text("キャンセル")');

    // Verify returned to list page
    await expect(page).toHaveURL("/test-cases");
  });

  test("should display character count for title field", async ({ page }) => {
    await page.click('button:has-text("新規作成")');

    const titleInput = page.locator('input[placeholder*="タイトル"]');
    await titleInput.fill("短いタイトル");

    // Verify character count is displayed
    await expect(page.locator('text=/7 \/ 200/')).toBeVisible();
  });

  test("should prevent title exceeding max length", async ({ page }) => {
    await page.click('button:has-text("新規作成")');

    const longTitle = "あ".repeat(201); // 201 characters
    const titleInput = page.locator('input[placeholder*="タイトル"]');
    await titleInput.fill(longTitle);

    // Verify only 200 characters are accepted
    const value = await titleInput.inputValue();
    expect(value.length).toBe(200);
  });
});
