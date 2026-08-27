import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { companySessionMaxAgeMs, COMPANY_SESSION_COOKIE, createCompanySessionToken, isCompanyLoginConfigured, validateCompanyCredentials } from "./companyAuth";
import { getDailyReport, listDailyReports, saveDailyReport } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { companyProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { reportInputSchema, reportSearchSchema } from "./reports.validation";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  company: router({
    status: publicProcedure.query(({ ctx }) => ({
      configured: isCompanyLoginConfigured(),
      authenticated: Boolean(ctx.companySession),
      passwordVersion: ctx.companySession?.passwordVersion ?? null,
    })),
    login: publicProcedure
      .input(z.object({ loginId: z.string().min(1).max(100), password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        if (!isCompanyLoginConfigured()) {
          throw new Error("共通ログインの設定が完了していません。管理者へ連絡してください。");
        }
        if (!validateCompanyCredentials(input.loginId, input.password)) {
          throw new Error("IDまたはパスワードが正しくありません。");
        }
        const token = await createCompanySessionToken();
        ctx.res.cookie(COMPANY_SESSION_COOKIE, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: companySessionMaxAgeMs(),
        });
        return { success: true, passwordVersion: ctx.companySession?.passwordVersion ?? process.env.COMPANY_PASSWORD_VERSION ?? null };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COMPANY_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  reports: router({
    list: companyProcedure
      .input(reportSearchSchema)
      .query(({ input }) => listDailyReports(input)),
    get: companyProcedure
      .input(z.object({ id: z.string().max(32) }))
      .query(({ input }) => getDailyReport(input.id)),
    save: companyProcedure
      .input(reportInputSchema)
      .mutation(({ input }) => saveDailyReport(input)),
  }),
});

export type AppRouter = typeof appRouter;
