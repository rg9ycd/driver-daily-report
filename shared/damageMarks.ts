import type { DamageMark } from "./report";

export const DAMAGE_CANVAS_WIDTH = 400;
export const DAMAGE_CANVAS_HEIGHT = 220;
const REMOVE_DISTANCE = 15;
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
