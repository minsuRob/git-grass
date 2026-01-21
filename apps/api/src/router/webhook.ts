import { Hono } from "hono";
import { syncService, type GitHubWebhookEvent } from "../services/sync";

const webhookRouter = new Hono();

/**
 * GitHub 웹훅 엔드포인트
 */
webhookRouter.post("/github", async (c) => {
  try {
    // GitHub 웹훅 시크릿 검증 (실제 환경에서는 필수)
    const signature = c.req.header("X-Hub-Signature-256");
    const event = c.req.header("X-GitHub-Event");
    
    if (!event) {
      return c.json({ error: "Missing X-GitHub-Event header" }, 400);
    }

    // 웹훅 페이로드 파싱
    const payload = await c.req.json() as any;
    
    const webhookEvent: GitHubWebhookEvent = {
      type: event,
      action: payload.action,
      repository: payload.repository,
      pusher: payload.pusher,
      sender: payload.sender,
      commits: payload.commits,
    };

    console.log(`Received GitHub webhook: ${event} for ${payload.repository?.full_name}`);

    // 웹훅 이벤트 처리
    const result = await syncService.processWebhookEvent(webhookEvent);

    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        processedAt: result.processedAt,
      });
    } else {
      console.error("Webhook processing failed:", result.error);
      return c.json({
        success: false,
        error: result.error,
        processedAt: result.processedAt,
      }, 500);
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown webhook error",
      processedAt: new Date().toISOString(),
    }, 500);
  }
});

/**
 * 웹훅 상태 확인 엔드포인트
 */
webhookRouter.get("/status", (c) => {
  return c.json({
    status: "active",
    timestamp: new Date().toISOString(),
    supportedEvents: ["push", "pull_request", "issues"],
  });
});

/**
 * 웹훅 테스트 엔드포인트 (개발용)
 */
webhookRouter.post("/test", async (c) => {
  try {
    const testEvent: GitHubWebhookEvent = {
      type: "push",
      repository: {
        id: 123456,
        name: "test-repo",
        full_name: "testuser/test-repo",
        owner: {
          login: "testuser",
          id: 12345,
        },
      },
      pusher: {
        name: "testuser",
        email: "test@example.com",
      },
      commits: [
        {
          id: "abc123",
          message: "Test commit",
          author: {
            name: "Test User",
            email: "test@example.com",
          },
          added: ["file1.txt"],
          removed: [],
          modified: ["file2.txt"],
        },
      ],
    };

    const result = await syncService.processWebhookEvent(testEvent);

    return c.json({
      success: true,
      message: "Test webhook processed",
      result,
    });
  } catch (error) {
    console.error("Test webhook error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Test webhook failed",
    }, 500);
  }
});

export { webhookRouter };
