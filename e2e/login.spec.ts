import { test, expect } from "@playwright/test";

const GITHUB_USER = process.env.GITHUB_TEST_USER;
const GITHUB_PASSWORD = process.env.GITHUB_TEST_PASSWORD;

test.describe("로그인 페이지 - 실제 GitHub 로그인", () => {
  test("로그인 페이지 로드 후 GitHub 로그인 버튼 클릭 시 인증 페이지로 이동", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /GitHub Dashboard/i })).toBeVisible();

    const githubLoginButton = page.getByRole("button", { name: /GitHub로 로그인/i });
    await expect(githubLoginButton).toBeVisible();
    await expect(githubLoginButton).toBeEnabled();

    await githubLoginButton.click();

    // 실제 로그인 플로우: API auth 또는 GitHub OAuth 페이지로 리다이렉트
    await page.waitForURL(
      (url) =>
        url.href.includes("localhost:3001/api/auth") ||
        url.href.includes("github.com/login/oauth"),
      { timeout: 15000 }
    );

    const url = page.url();
    expect(
      url.includes("localhost:3001/api/auth") || url.includes("github.com")
    ).toBeTruthy();
  });

  test("실제 GitHub 로그인 진행 후 대시보드 진입까지 성공", async ({ page }) => {
    test.skip(
      !GITHUB_USER || !GITHUB_PASSWORD,
      "GITHUB_TEST_USER, GITHUB_TEST_PASSWORD 환경 변수가 필요합니다."
    );

    await page.goto("/login");

    const githubLoginButton = page.getByRole("button", { name: /GitHub로 로그인/i });
    await expect(githubLoginButton).toBeVisible();
    await githubLoginButton.click();

    // GitHub 로그인 페이지 또는 API 리다이렉트 대기
    await page.waitForURL(
      (url) =>
        url.href.includes("localhost:3001/api/auth") ||
        url.href.includes("github.com"),
      { timeout: 15000 }
    );

    // GitHub 로그인 화면이면 이메일/비밀번호 입력 (GitHub 실제 로그인 페이지: #login_field, #password)
    if (page.url().includes("github.com/login")) {
      await page.locator("#login_field").fill(GITHUB_USER!);
      await page.locator("#password").fill(GITHUB_PASSWORD!);
      await page.getByRole("button", { name: /Sign in/i }).click();

      // OAuth authorize 화면 (있다면) 승인
      await page.waitForURL(
        (url) =>
          url.href.includes("github.com/login/oauth/authorize") ||
          url.href.includes("localhost:8081") ||
          url.href.includes("localhost:3001"),
        { timeout: 10000 }
      ).catch(() => {});

      const authorizeButton = page.getByRole("button", {
        name: /authorize|승인|allow/i,
      });
      if (await authorizeButton.isVisible()) {
        await authorizeButton.click();
      }
    }

    // 콜백 후 앱(대시보드)으로 돌아올 때까지 대기
    await page.waitForURL(
      (url) => {
        const u = url.href;
        return (
          (u.includes("localhost:8081") && !u.includes("/login")) ||
          u === "http://localhost:8081/"
        );
      },
      { timeout: 20000 }
    );

    // 로그인 성공: 로그인 페이지가 아니고, 대시보드 콘텐츠 노출
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(
      page.getByText(/매일의 작업 현황|GitHub Dashboard|개발 활동/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
