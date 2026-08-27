import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getDailyReport, listDailyReports, saveDailyReport } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { reportInputSchema } from "./reports.validation";

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
  reports: router({
    list: protectedProcedure.query(({ ctx }) => listDailyReports(ctx.user.id)),
    get: protectedProcedure
      .input(z.object({ id: z.string().max(32) }))
      .query(({ ctx, input }) => getDailyReport(ctx.user.id, input.id)),
    save: protectedProcedure
      .input(reportInputSchema)
      .mutation(({ ctx, input }) => saveDailyReport(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
