import { useCallback, useEffect, useRef } from "react";
import type { DamageMark } from "@shared/report";
import { DAMAGE_CANVAS_HEIGHT, DAMAGE_CANVAS_WIDTH, toDamageMark, toggleDamageMark } from "@shared/damageMarks";

const CAR_IMAGE_URL = "/manus-storage/car_e7901ad2.png";

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
      <img className="damage-canvas-image" src={CAR_IMAGE_URL} alt="車両傷チェック用の車両イラスト" loading="eager" />
      <canvas
        ref={canvasRef}
        width={DAMAGE_CANVAS_WIDTH}
        height={DAMAGE_CANVAS_HEIGHT}
        onPointerDown={handlePointerDown}
        className="damage-canvas"
        aria-label={readOnly ? "提供車両イラストへ記録済みの傷マークを重ねた図" : "提供車両イラストの傷チェック。任意の位置をクリックすると傷マークを追加します。既存マークのクリックで削除します。"}
      />
    </div>
  );
}
