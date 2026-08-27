import type { DamageMark } from "./report";

export const DAMAGE_CANVAS_WIDTH = 400;
export const DAMAGE_CANVAS_HEIGHT = 220;
const REMOVE_DISTANCE = 15;

type CanvasBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

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
