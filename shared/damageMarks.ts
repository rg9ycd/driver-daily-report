import type { DamageMark } from "./report";

// The replacement car.webp is a 1447×2048 four-view sheet. Keeping a compact
// 400-wide normalized space preserves stable, resolution-independent marks.
export const DAMAGE_CANVAS_WIDTH = 400;
export const DAMAGE_CANVAS_HEIGHT = 566;
export const DAMAGE_COORDINATE_VERSION = 2;
const REMOVE_DISTANCE = 15;

// The former 2800×1960 asset was contained inside a 400×220 canvas, leaving
// horizontal letterboxing. Convert legacy marks through that fitted image rect
// so old records keep their relative position on the replacement four-view sheet.
const LEGACY_IMAGE_RECT = { x: 42.85714285714286, y: 0, width: 314.2857142857143, height: 220 };
const NEW_IMAGE_RECT = { x: 0, y: 0, width: DAMAGE_CANVAS_WIDTH, height: DAMAGE_CANVAS_HEIGHT };
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type CanvasBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function getContainedImageRect(imageWidth: number, imageHeight: number) {
  const scale = Math.min(DAMAGE_CANVAS_WIDTH / imageWidth, DAMAGE_CANVAS_HEIGHT / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (DAMAGE_CANVAS_WIDTH - width) / 2,
    y: (DAMAGE_CANVAS_HEIGHT - height) / 2,
    width,
    height,
  };
}

export function toDamageMark(clientX: number, clientY: number, bounds: CanvasBounds): DamageMark {
  return {
    x: Math.max(0, Math.min(DAMAGE_CANVAS_WIDTH, (clientX - bounds.left) * (DAMAGE_CANVAS_WIDTH / bounds.width))),
    y: Math.max(0, Math.min(DAMAGE_CANVAS_HEIGHT, (clientY - bounds.top) * (DAMAGE_CANVAS_HEIGHT / bounds.height))),
  };
}

export function toggleDamageMark(marks: DamageMark[], point: DamageMark): DamageMark[] {
  const closeIndex = marks.findIndex((mark) => Math.hypot(mark.x - point.x, mark.y - point.y) < REMOVE_DISTANCE);
  return closeIndex >= 0 ? marks.filter((_, index) => index !== closeIndex) : [...marks, point];
}

export function clampDamageZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 10) / 10));
}

export function getPinchZoom(currentZoom: number, previousDistance: number, nextDistance: number) {
  if (previousDistance <= 0) return clampDamageZoom(currentZoom);
  return clampDamageZoom(currentZoom * (nextDistance / previousDistance));
}

export type DamagePan = { x: number; y: number };

export function clampDamagePan(zoom: number, pan: DamagePan): DamagePan {
  const maxX = ((clampDamageZoom(zoom) - 1) * DAMAGE_CANVAS_WIDTH) / 2;
  const maxY = ((clampDamageZoom(zoom) - 1) * DAMAGE_CANVAS_HEIGHT) / 2;
  return {
    x: maxX === 0 ? 0 : Math.min(maxX, Math.max(-maxX, pan.x)),
    y: maxY === 0 ? 0 : Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

export function migrateLegacyDamageMarks(marks: DamageMark[]): DamageMark[] {
  return marks.map((mark) => {
    const relativeX = Math.max(0, Math.min(1, (mark.x - LEGACY_IMAGE_RECT.x) / LEGACY_IMAGE_RECT.width));
    const relativeY = Math.max(0, Math.min(1, (mark.y - LEGACY_IMAGE_RECT.y) / LEGACY_IMAGE_RECT.height));
    return {
      x: NEW_IMAGE_RECT.x + relativeX * NEW_IMAGE_RECT.width,
      y: NEW_IMAGE_RECT.y + relativeY * NEW_IMAGE_RECT.height,
    };
  });
}

export function parseStoredDamageMarks(value: string): DamageMark[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return migrateLegacyDamageMarks(parsed as DamageMark[]);
    if (parsed && typeof parsed === "object" && "version" in parsed && "marks" in parsed) {
      const stored = parsed as { version?: unknown; marks?: unknown };
      if (stored.version === DAMAGE_COORDINATE_VERSION && Array.isArray(stored.marks)) return stored.marks as DamageMark[];
    }
  } catch {
    // Return an empty mark list for malformed legacy rows.
  }
  return [];
}

export function serializeDamageMarks(marks: DamageMark[]) {
  return JSON.stringify({ version: DAMAGE_COORDINATE_VERSION, marks });
}

export function appendDamageHistory(history: DamageMark[][], index: number, nextMarks: DamageMark[]) {
  const nextHistory = [...history.slice(0, index + 1), nextMarks];
  return { history: nextHistory.slice(-50), index: Math.min(nextHistory.length - 1, 49) };
}
