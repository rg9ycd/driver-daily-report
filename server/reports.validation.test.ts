import { describe, expect, it } from "vitest";
import { reportInputSchema } from "./reports.validation";

const validReport = {
  date: "2026-08-27",
  vehicleNumber: "102",
  siteName: "本社車庫",
  sq: "SQ-01",
  confirmer: "確認 太郎",
  inspection: { "ブレーキ:確認済み": true },
  damages: [{ x: 200, y: 110 }],
  records: [
    {
      driver: "運転 太郎",
      passenger: "",
      rollCaller: "点呼 花子",
      departurePlace: "営業所",
      arrivalPlace: "現場",
      departureTime: "08:30",
      arrivalTime: "17:00",
      departureMeter: "12345",
      arrivalMeter: "12410",
      alcoholBefore: true,
      alcoholAfter: true,
      alcoholBeforeValue: "0.00",
      alcoholAfterValue: "0.00",
    },
  ],
};

describe("reportInputSchema", () => {
  it("帳票、車両点検、傷マーク、運行記録を受け付ける", () => {
    const result = reportInputSchema.parse(validReport);
    expect(result.damages).toEqual([{ x: 200, y: 110 }]);
    expect(result.records).toHaveLength(1);
  });

  it("傷マークがCanvas座標系の範囲外なら拒否する", () => {
    expect(() => reportInputSchema.parse({ ...validReport, damages: [{ x: 401, y: 110 }] })).toThrow();
  });

  it("運行記録は最大4回分までに制限する", () => {
    expect(() => reportInputSchema.parse({ ...validReport, records: Array.from({ length: 5 }, () => validReport.records[0]) })).toThrow();
  });
});
