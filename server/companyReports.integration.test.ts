import { describe, expect, it } from "vitest";
import { createCompanySessionToken, COMPANY_SESSION_COOKIE } from "./companyAuth";
import { createContext } from "./_core/context";
import { appRouter } from "./routers";

describe("共通ログインの日報一覧API", () => {
  it("有効な共通セッションで検索・ソート付きの日報一覧を参照できる", async () => {
    const token = await createCompanySessionToken();
    const ctx = await createContext({
      req: {
        protocol: "https",
        headers: { cookie: `${COMPANY_SESSION_COOKIE}=${token}` },
      } as Parameters<typeof createContext>[0]["req"],
      res: {} as Parameters<typeof createContext>[0]["res"],
    });

    expect(ctx.companySession).not.toBeNull();
    const reports = await appRouter.createCaller(ctx).reports.list({
      vehicleNumber: "__integration_query_no_match__",
      sortBy: "reportDate",
      sortDirection: "asc",
    });
    expect(reports).toEqual([]);
  });
});
