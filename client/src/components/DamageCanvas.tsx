import { useCallback, useEffect, useRef } from "react";
import type { DamageMark } from "@shared/report";
import { DAMAGE_CANVAS_HEIGHT, DAMAGE_CANVAS_WIDTH, toDamageMark, toggleDamageMark } from "@shared/damageMarks";
import VehicleSilhouette from "./VehicleSilhouette";

type DamageCanvasProps = {
  marks: DamageMark[];
  onChange?: (marks: DamageMark[]) => void;
  readOnly?: boolean;
  className?: string;
};

export default function DamageCanvas({ marks, onChange, readOnly = false, className = "" }: DamageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const point = toDamageMark(event.clientX, event.clientY, rect);
    onChange(toggleDamageMark(marks, point));
  };

  return (
    <div className={`damage-canvas-wrap ${readOnly ? "is-read-only" : ""} ${className}`}>
      <VehicleSilhouette className="damage-canvas-vehicle" />
      <canvas
        ref={canvasRef}
        width={DAMAGE_CANVAS_WIDTH}
        height={DAMAGE_CANVAS_HEIGHT}
        onPointerDown={handlePointerDown}
        className="damage-canvas"
        aria-label={readOnly ? "記録済みの車両傷マーク" : "車両傷チェック。車両の任意の位置をクリックすると傷マークを追加します。既存マークのクリックで削除します。"}
      />
    </div>
  );
}
