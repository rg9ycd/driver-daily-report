import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { sessionHasCurrentPasswordVersion } from "./companyAuth";
import type { TrpcContext } from "./_core/context";

function createContext(): { ctx: TrpcContext; cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> } {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    cookies,
    ctx: {
      user: null,
      companySession: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
        clearCookie: () => undefined,
      } as TrpcContext["res"],
    },
  };
}

describe("company.login", () => {
  it("設定済みの共通IDとパスワードで署名付きセッションCookieを発行する", async () => {
    const loginId = process.env.COMPANY_LOGIN_ID;
    const password = process.env.COMPANY_LOGIN_PASSWORD;
    expect(loginId).toBeTruthy();
    expect(password).toBeTruthy();
    const { ctx, cookies } = createContext();
    const result = await appRouter.createCaller(ctx).company.login({ loginId: loginId!, password: password! });
    expect(result.success).toBe(true);
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe("driver_company_session");
    expect(cookies[0]?.value.length).toBeGreaterThan(30);
  });

  it("パスワード世代の更新後は旧セッションを無効として扱う", () => {
    expect(sessionHasCurrentPasswordVersion({ passwordVersion: "2026-08" }, "2026-08")).toBe(true);
    expect(sessionHasCurrentPasswordVersion({ passwordVersion: "2026-08" }, "2026-09")).toBe(false);
  });
});
