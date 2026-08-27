import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, Redo2, RotateCcw, Undo2 } from "lucide-react";
import type { DamageMark } from "@shared/report";
import { appendDamageHistory, clampDamageZoom, DAMAGE_CANVAS_HEIGHT, DAMAGE_CANVAS_WIDTH, getPinchZoom, toDamageMark, toggleDamageMark } from "@shared/damageMarks";

const CAR_IMAGE_URL = "/manus-storage/car_e7901ad2.png";

type DamageCanvasProps = {
  marks: DamageMark[];
  onChange?: (marks: DamageMark[]) => void;
  readOnly?: boolean;
  className?: string;
};

export default function DamageCanvas({ marks, onChange, readOnly = false, className = "" }: DamageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<DamageMark[][]>(() => [marks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const expectedMarksRef = useRef(marks);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchActiveRef = useRef(false);

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
      pinchActiveRef.current = true;
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    pinchActiveRef.current = false;
    canvas.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onChange || !pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size < 2) return;
    const [first, second] = Array.from(pointersRef.current.values());
    const nextDistance = Math.hypot(first.x - second.x, first.y - second.y);
    const previousDistance = pinchDistanceRef.current;
    if (previousDistance && Math.abs(nextDistance - previousDistance) > 1) {
      setZoom(current => getPinchZoom(current, previousDistance, nextDistance));
      pinchDistanceRef.current = nextDistance;
    }
    pinchActiveRef.current = true;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hadPinch = pinchActiveRef.current;
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchDistanceRef.current = null;
    if (pointersRef.current.size === 0) pinchActiveRef.current = false;
    if (hadPinch) return;

    const rect = canvas.getBoundingClientRect();
    const point = toDamageMark(event.clientX, event.clientY, rect);
    applyMarks(toggleDamageMark(marks, point));
  };

  const setZoomWithinRange = (amount: number) => setZoom(current => clampDamageZoom(current + amount));

  return (
    <div className={`damage-canvas-wrap ${readOnly ? "is-read-only" : ""} ${zoom > 1 ? "is-zoomed" : ""} ${className}`}>
      {!readOnly && <div className="damage-zoom-controls" aria-label="車両画像と傷マークの操作"><button type="button" onClick={() => restoreHistory(historyIndex - 1)} disabled={historyIndex === 0} aria-label="傷マーク操作を元に戻す"><Undo2 size={15} /></button><button type="button" onClick={() => restoreHistory(historyIndex + 1)} disabled={historyIndex >= history.length - 1} aria-label="傷マーク操作をやり直す"><Redo2 size={15} /></button><span className="damage-control-divider" /><button type="button" onClick={() => setZoomWithinRange(-0.25)} disabled={zoom <= 1} aria-label="縮小"><Minus size={15} /></button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoomWithinRange(0.25)} disabled={zoom >= 3} aria-label="拡大"><Plus size={15} /></button><button type="button" onClick={() => setZoom(1)} disabled={zoom === 1} aria-label="倍率をリセット"><RotateCcw size={14} /></button></div>}
      <div className="damage-canvas-viewport">
        <div className="damage-canvas-stage" style={{ transform: `scale(${zoom})` }}>
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
      {!readOnly && <span className="damage-zoom-hint"><Maximize2 size={12} />スマホは2本指でピンチ操作</span>}
    </div>
  );
}
