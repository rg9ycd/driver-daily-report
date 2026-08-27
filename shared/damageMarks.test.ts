import { describe, expect, it } from "vitest";
import { getContainedImageRect, toDamageMark, toggleDamageMark } from "./damageMarks";

describe("車両傷マーク操作", () => {
  it("画面上のクリック位置を400×220の帳票座標へ変換する", () => {
    const point = toDamageMark(110, 75, { left: 10, top: 20, width: 200, height: 110 });
    expect(point).toEqual({ x: 200, y: 110 });
  });

  it("既存マークから離れたクリックで傷マークを追加する", () => {
    const marks = toggleDamageMark([{ x: 100, y: 100 }], { x: 200, y: 120 });
    expect(marks).toEqual([{ x: 100, y: 100 }, { x: 200, y: 120 }]);
  });

  it("既存マーク付近のクリックでその傷マークを削除する", () => {
    const marks = toggleDamageMark([{ x: 100, y: 100 }, { x: 240, y: 120 }], { x: 109, y: 106 });
    expect(marks).toEqual([{ x: 240, y: 120 }]);
  });

  it("縦長寄りの車両イラストをCanvas内に収め、帳票と同じ描画領域を返す", () => {
    expect(getContainedImageRect(1400, 980)).toEqual({ x: 42.85714285714286, y: 0, width: 314.2857142857143, height: 220 });
  });
});
