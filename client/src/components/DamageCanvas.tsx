import React, { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, Redo2, RotateCcw, Undo2 } from "lucide-react";
import type { DamageMark } from "@shared/report";
import { appendDamageHistory, clampDamagePan, clampDamageZoom, DAMAGE_CANVAS_HEIGHT, DAMAGE_CANVAS_WIDTH, getPinchZoom, toDamageMark, toggleDamageMark, type DamagePan } from "@shared/damageMarks";

const CAR_IMAGE_URL = "/manus-storage/car_fdd56015.webp";
const CAR_IMAGE_CONTENT_SCALE = 1.08;

type DamageCanvasProps = {
  marks: DamageMark[];
  onChange?: (marks: DamageMark[]) => void;
  readOnly?: boolean;
  className?: string;
};

export default function DamageCanvas({ marks, onChange, readOnly = false, className = "" }: DamageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<DamagePan>({ x: 0, y: 0 });
  const [history, setHistory] = useState<DamageMark[][]>(() => [marks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const expectedMarksRef = useRef(marks);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);
  const gestureRef = useRef<"tap" | "pan" | "pinch">("tap");
  const dragStartRef = useRef<{ x: number; y: number; pan: DamagePan } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, DAMAGE_CANVAS_WIDTH, DAMAGE_CANVAS_HEIGHT);
    marks.forEach((mark, index) => {
      context.beginPath();
      context.arc(mark.x, mark.y, 11, 0, Math.PI * 2);
      context.fillStyle = "rgba(190, 43, 43, 0.12)";
      context.fill();
      context.strokeStyle = "#b82727";
      context.lineWidth = 2.4;
      context.stroke();
      context.beginPath();
      context.arc(mark.x, mark.y, 2.4, 0, Math.PI * 2);
      context.fillStyle = "#b82727";
      context.fill();
      context.font = "600 9px sans-serif";
      context.textAlign = "center";
      context.fillText(String(index + 1), mark.x, mark.y - 15);
    });
  }, [marks]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (marks === expectedMarksRef.current) return;
    expectedMarksRef.current = marks;
    setHistory([marks]);
    setHistoryIndex(0);
  }, [marks]);

  const applyMarks = (nextMarks: DamageMark[]) => {
    const nextState = appendDamageHistory(history, historyIndex, nextMarks);
    expectedMarksRef.current = nextMarks;
    setHistory(nextState.history);
    setHistoryIndex(nextState.index);
    onChange?.(nextMarks);
  };

  const restoreHistory = (nextIndex: number) => {
    const nextMarks = history[nextIndex];
    if (!nextMarks) return;
    expectedMarksRef.current = nextMarks;
    setHistoryIndex(nextIndex);
    onChange?.(nextMarks);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchDistanceRef.current = Math.hypot(first.x - second.x, first.y - second.y);
      gestureRef.current = "pinch";
      dragStartRef.current = null;
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    gestureRef.current = "tap";
    dragStartRef.current = { x: event.clientX, y: event.clientY, pan };
    canvas.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onChange || !pointersRef.current.has(event.pointerId)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size < 2) {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) < 5) return;
      gestureRef.current = "pan";
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = DAMAGE_CANVAS_WIDTH / rect.width;
      const scaleY = DAMAGE_CANVAS_HEIGHT / rect.height;
      setPan(clampDamagePan(zoom, { x: start.pan.x + dx * scaleX, y: start.pan.y + dy * scaleY }));
      return;
    }
    const [first, second] = Array.from(pointersRef.current.values());
    const nextDistance = Math.hypot(first.x - second.x, first.y - second.y);
    const previousDistance = pinchDistanceRef.current;
    if (previousDistance && Math.abs(nextDistance - previousDistance) > 1) {
      setZoom(current => {
        const nextZoom = getPinchZoom(current, previousDistance, nextDistance);
        setPan(currentPan => clampDamagePan(nextZoom, currentPan));
        return nextZoom;
      });
      pinchDistanceRef.current = nextDistance;
    }
    gestureRef.current = "pinch";
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gesture = gestureRef.current;
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchDistanceRef.current = null;
    if (pointersRef.current.size === 1) {
      const remaining = Array.from(pointersRef.current.values())[0];
      dragStartRef.current = remaining ? { x: remaining.x, y: remaining.y, pan } : null;
      gestureRef.current = "pan";
      return;
    }
    dragStartRef.current = null;
    gestureRef.current = "tap";
    if (gesture !== "tap") return;

    const rect = canvas.getBoundingClientRect();
    const point = toDamageMark(event.clientX, event.clientY, rect);
    applyMarks(toggleDamageMark(marks, point));
  };

  const setZoomWithinRange = (amount: number) => setZoom(current => {
    const nextZoom = clampDamageZoom(current + amount);
    setPan(currentPan => clampDamagePan(nextZoom, currentPan));
    return nextZoom;
  });

  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={`damage-canvas-wrap ${readOnly ? "is-read-only" : ""} ${zoom > 1 ? "is-zoomed" : ""} ${className}`}>
      {!readOnly && <div className="damage-zoom-controls" aria-label="車両画像と傷マークの操作"><button type="button" onClick={() => restoreHistory(historyIndex - 1)} disabled={historyIndex === 0} aria-label="傷マーク操作を元に戻す"><Undo2 size={15} /></button><button type="button" onClick={() => restoreHistory(historyIndex + 1)} disabled={historyIndex >= history.length - 1} aria-label="傷マーク操作をやり直す"><Redo2 size={15} /></button><span className="damage-control-divider" /><button type="button" onClick={() => setZoomWithinRange(-0.25)} disabled={zoom <= 1} aria-label="縮小"><Minus size={15} /></button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoomWithinRange(0.25)} disabled={zoom >= 3} aria-label="拡大"><Plus size={15} /></button><button type="button" onClick={resetViewport} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label="倍率と表示位置をリセット"><RotateCcw size={14} /></button></div>}
      <div ref={viewportRef} className="damage-canvas-viewport">
        <div className="damage-canvas-stage" style={{ transform: `translate(${(pan.x / DAMAGE_CANVAS_WIDTH) * 100}%, ${(pan.y / DAMAGE_CANVAS_HEIGHT) * 100}%) scale(${zoom * CAR_IMAGE_CONTENT_SCALE})` }}>
          <img className="damage-canvas-image" src={CAR_IMAGE_URL} alt="車両傷チェック用の車両イラスト" loading="eager" />
          <canvas
            ref={canvasRef}
            width={DAMAGE_CANVAS_WIDTH}
            height={DAMAGE_CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="damage-canvas"
            aria-label={readOnly ? "提供車両イラストへ記録済みの傷マークを重ねた図" : "提供車両イラストの傷チェック。ピンチ操作または拡大縮小ボタンで画像を拡大し、任意の位置をタップすると傷マークを追加します。既存マークのタップで削除します。"}
          />
        </div>
      </div>
      {!readOnly && <span className="damage-zoom-hint"><Maximize2 size={12} />スマホはピンチ後に1本指、PCはマウスドラッグで移動</span>}
    </div>
  );
}
