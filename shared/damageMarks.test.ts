import { describe, expect, it } from "vitest";
import { appendDamageHistory, clampDamagePan, clampDamageZoom, getContainedImageRect, getPinchZoom, parseStoredDamageMarks, serializeDamageMarks, toDamageMark, toggleDamageMark } from "./damageMarks";

describe("車両傷マーク操作", () => {
  it("画面上のクリック位置を400×566の帳票座標へ変換する", () => {
    const point = toDamageMark(110, 303, { left: 10, top: 20, width: 200, height: 283 });
    expect(point).toEqual({ x: 200, y: 566 });
  });

  it("中央基準で200%に拡大した表示でもクリック位置を帳票座標へ変換する", () => {
    const point = toDamageMark(200, 283, { left: -200, top: -283, width: 800, height: 1132 });
    expect(point).toEqual({ x: 200, y: 283 });
  });

  it("パン移動した200%表示でもクリック位置を本来の傷マーク座標へ変換する", () => {
    const point = toDamageMark(300, 283, { left: -100, top: -283, width: 800, height: 1132 });
    expect(point).toEqual({ x: 200, y: 283 });
  });

  it("既存マークから離れたクリックで傷マークを追加する", () => {
    const marks = toggleDamageMark([{ x: 100, y: 100 }], { x: 200, y: 120 });
    expect(marks).toEqual([{ x: 100, y: 100 }, { x: 200, y: 120 }]);
  });

  it("既存マーク付近のクリックでその傷マークを削除する", () => {
    const marks = toggleDamageMark([{ x: 100, y: 100 }, { x: 240, y: 120 }], { x: 109, y: 106 });
    expect(marks).toEqual([{ x: 240, y: 120 }]);
  });

  it("横長の素材でも新しい400×566のCanvas内に収め、帳票と同じ描画領域を返す", () => {
    expect(getContainedImageRect(1400, 980)).toEqual({ x: 0, y: 143, width: 400, height: 280 });
  });

  it("ピンチイン・アウトの距離比で倍率を更新し、1倍から3倍の範囲に保つ", () => {
    expect(getPinchZoom(1, 100, 160)).toBe(1.6);
    expect(getPinchZoom(1.6, 160, 80)).toBe(1);
    expect(getPinchZoom(2.8, 100, 150)).toBe(3);
    expect(clampDamageZoom(.3)).toBe(1);
  });

  it("パン移動を拡大率に応じた表示範囲へ制限する", () => {
    expect(clampDamagePan(2, { x: 250, y: -400 })).toEqual({ x: 200, y: -283 });
    expect(clampDamagePan(1, { x: 20, y: -20 })).toEqual({ x: 0, y: 0 });
  });

  it("旧400×220画像の傷座標を新しい4面図の相対位置へ移行する", () => {
    expect(parseStoredDamageMarks(JSON.stringify([{ x: 42.85714285714286, y: 0 }]))).toEqual([{ x: 0, y: 0 }]);
    const migrated = parseStoredDamageMarks(JSON.stringify([{ x: 200, y: 110 }]));
    expect(migrated[0].x).toBeCloseTo(200, 5);
    expect(migrated[0].y).toBeCloseTo(283, 5);
  });

  it("新しい傷座標をバージョン付きJSONとして保存し、同じ座標で復元する", () => {
    const marks = [{ x: 120, y: 510 }];
    const stored = serializeDamageMarks(marks);
    expect(JSON.parse(stored)).toEqual({ version: 2, marks });
    expect(parseStoredDamageMarks(stored)).toEqual(marks);
  });

  it("傷マークを戻した後に新しい操作をすると、以後のリドゥ履歴を破棄する", () => {
    const first = [{ x: 100, y: 50 }];
    const second = [{ x: 100, y: 50 }, { x: 200, y: 100 }];
    const result = appendDamageHistory([[], first, second], 1, [{ x: 150, y: 80 }]);
    expect(result).toEqual({ history: [[], first, [{ x: 150, y: 80 }]], index: 2 });
  });
});
