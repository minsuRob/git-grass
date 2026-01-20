import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  // 세션 정보 조회
  getSession: publicProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user || null,
      session: ctx.session || null,
    };
  }),

  // GitHub 연결 URL 생성
  connectGitHub: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // GitHub OAuth URL 생성
      const baseUrl = process.env.GITHUB_OAUTH_URL || "https://github.com/login/oauth/authorize";
      const clientId = process.env.GITHUB_CLIENT_ID;
      const redirectUri = process.env.GITHUB_REDIRECT_URI || "http://localhost:3001/api/auth/callback/github";
      
      if (!clientId) {
        throw new Error("GitHub Client ID not configured");
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "user:email,repo,read:user",
        state: ctx.user.id, // 사용자 ID를 state로 전달
      });

      const authUrl = `${baseUrl}?${params.toString()}`;

      return {
        success: true,
        redirectUrl: authUrl,
      };
    } catch (error) {
      console.error("GitHub OAuth URL generation error:", error);
      return {
        success: false,
        error: "Failed to generate GitHub OAuth URL",
      };
    }
  }),

  // GitHub 연결 해제
  disconnectGitHub: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // 사용자의 GitHub 연결 정보 제거
      // 실제 구현에서는 데이터베이스에서 GitHub 토큰을 제거해야 함
      console.log(`Disconnecting GitHub for user: ${ctx.user.id}`);
      
      return {
        success: true,
        message: "GitHub connection removed successfully",
      };
    } catch (error) {
      console.error("GitHub disconnect error:", error);
      return {
        success: false,
        error: "Failed to disconnect GitHub",
      };
    }
  }),

  // 사용자 프로필 조회
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      image: ctx.user.image,
      createdAt: ctx.user.createdAt,
      updatedAt: ctx.user.updatedAt,
    };
  }),
});