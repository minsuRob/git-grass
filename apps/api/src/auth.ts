import { auth } from "@acme/auth";
import { Context } from "hono";
import { getCookie } from "hono/cookie";

/**
 * better-auth와 Hono 통합을 위한 인증 미들웨어
 */
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  try {
    // 쿠키에서 세션 토큰 추출
    const sessionToken = getCookie(c, "better-auth.session_token");
    
    if (sessionToken) {
      // better-auth를 사용하여 세션 검증
      const session = await auth.api.getSession({
        headers: {
          cookie: `better-auth.session_token=${sessionToken}`,
        },
      });

      if (session) {
        // 컨텍스트에 사용자 정보 저장
        c.set("user", session.user);
        c.set("session", session.session);
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
  }

  await next();
}

/**
 * 인증된 사용자만 접근 가능한 미들웨어
 */
export async function requireAuth(c: Context, next: () => Promise<void>) {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return await next();
}

/**
 * 현재 사용자 정보 조회
 */
export function getCurrentUser(c: Context) {
  return c.get("user");
}

/**
 * 현재 세션 정보 조회
 */
export function getCurrentSession(c: Context) {
  return c.get("session");
}

/**
 * better-auth API 핸들러를 Hono에 통합
 */
export function createAuthHandler() {
  return async (c: Context) => {
    const body = c.req.method !== "GET" ? await c.req.text() : null;
    
    const request = new Request(c.req.url, {
      method: c.req.method,
      headers: c.req.header(),
      body: body,
    });

    const response = await auth.handler(request);
    
    // 응답 헤더 복사
    response.headers.forEach((value, key) => {
      c.header(key, value);
    });

    // 쿠키 설정 처리
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      c.header("set-cookie", setCookieHeader);
    }

    const responseBody = await response.text();
    return c.text(responseBody, response.status as any);
  };
}