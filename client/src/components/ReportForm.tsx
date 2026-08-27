import { useState, type ReactNode } from "react";
import { Check, ChevronDown, CircleAlert, Eraser, Plus, ShieldCheck } from "lucide-react";
import type { ReportData, RouteRecord } from "@shared/report";
import { inspectionGroups, inspectionKeys } from "@shared/report";
import DamageCanvas from "./DamageCanvas";

type ReportFormProps = {
  data: ReportData;
  onChange: (data: ReportData) => void;
};

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`form-field ${className}`}><span>{label}</span>{children}</label>;
}

function Section({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="form-section">
      <div className="section-heading"><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      {children}
    </section>
  );
}

function RecordEditor({ record, index, onChange }: { record: RouteRecord; index: number; onChange: (record: RouteRecord) => void }) {
  const [open, setOpen] = useState(index === 0);
  const update = <K extends keyof RouteRecord>(key: K, value: RouteRecord[K]) => onChange({ ...record, [key]: value });

  return (
    <div className={`record-editor ${open ? "is-open" : ""}`}>
      <button type="button" className="record-editor-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span className="record-editor-number">{String(index + 1).padStart(2, "0")}</span>
        <span><strong>運行記録 {index + 1}</strong><small>{record.departurePlace || record.arrivalPlace ? `${record.departurePlace || "出発地"} → ${record.arrivalPlace || "到着地"}` : "タップして入力"}</small></span>
        <ChevronDown size={17} />
      </button>
      {open && <div className="record-editor-body">
        <div className="form-grid three">
          <Field label="ドライバー"><input value={record.driver} onChange={(event) => update("driver", event.target.value)} placeholder="氏名" /></Field>
          <Field label="同乗者"><input value={record.passenger} onChange={(event) => update("passenger", event.target.value)} placeholder="氏名（任意）" /></Field>
          <Field label="点呼者"><input value={record.rollCaller} onChange={(event) => update("rollCaller", event.target.value)} placeholder="氏名" /></Field>
        </div>
        <div className="form-grid two">
          <Field label="出発地"><input value={record.departurePlace} onChange={(event) => update("departurePlace", event.target.value)} placeholder="例：営業所" /></Field>
          <Field label="到着地"><input value={record.arrivalPlace} onChange={(event) => update("arrivalPlace", event.target.value)} placeholder="例：○○工事現場" /></Field>
        </div>
        <div className="form-grid four">
          <Field label="出発時間"><input type="time" value={record.departureTime} onChange={(event) => update("departureTime", event.target.value)} /></Field>
          <Field label="到着時間"><input type="time" value={record.arrivalTime} onChange={(event) => update("arrivalTime", event.target.value)} /></Field>
          <Field label="出発メーター（km）"><input inputMode="numeric" value={record.departureMeter} onChange={(event) => update("departureMeter", event.target.value)} placeholder="00000" /></Field>
          <Field label="到着メーター（km）"><input inputMode="numeric" value={record.arrivalMeter} onChange={(event) => update("arrivalMeter", event.target.value)} placeholder="00000" /></Field>
        </div>
        <div className="alcohol-checks">
          <div className="alcohol-check"><button type="button" className={record.alcoholBefore ? "is-checked" : ""} onClick={() => update("alcoholBefore", !record.alcoholBefore)}><span>{record.alcoholBefore && <Check size={13} />}</span>乗務前・異常なし</button><input aria-label="乗務前の呼気中濃度" value={record.alcoholBeforeValue} onChange={(event) => update("alcoholBeforeValue", event.target.value)} placeholder="0.00" /><small>mg/ℓ</small></div>
          <div className="alcohol-check"><button type="button" className={record.alcoholAfter ? "is-checked" : ""} onClick={() => update("alcoholAfter", !record.alcoholAfter)}><span>{record.alcoholAfter && <Check size={13} />}</span>乗務後・異常なし</button><input aria-label="乗務後の呼気中濃度" value={record.alcoholAfterValue} onChange={(event) => update("alcoholAfterValue", event.target.value)} placeholder="0.00" /><small>mg/ℓ</small></div>
        </div>
      </div>}
    </div>
  );
}

export default function ReportForm({ data, onChange }: ReportFormProps) {
  const set = <K extends keyof ReportData>(key: K, value: ReportData[K]) => onChange({ ...data, [key]: value });
  const changeRecord = (index: number, record: RouteRecord) => onChange({ ...data, records: data.records.map((current, currentIndex) => currentIndex === index ? record : current) });
  const inspectionCount = inspectionKeys.filter((key) => data.inspection[key]).length;

  return (
    <div className="report-form">
      <Section number="01" title="基本情報" subtitle="帳票のヘッダーに反映されます">
        <div className="form-grid three">
          <Field label="日付"><input type="date" value={data.date} onChange={(event) => set("date", event.target.value)} /></Field>
          <Field label="号車"><input value={data.vehicleNumber} onChange={(event) => set("vehicleNumber", event.target.value)} placeholder="例：102" /></Field>
          <Field label="SQ"><input value={data.sq} onChange={(event) => set("sq", event.target.value)} placeholder="例：SQ-01" /></Field>
        </div>
        <div className="form-grid two form-grid-spaced"><Field label="現場名"><input value={data.siteName} onChange={(event) => set("siteName", event.target.value)} placeholder="例：○○新築工事" /></Field><Field label="状況確認者"><input value={data.confirmer} onChange={(event) => set("confirmer", event.target.value)} placeholder="確認者氏名" /></Field></div>
      </Section>

      <Section number="02" title="車両運転前検査" subtitle="裏面の点検表に反映されます">
        <div className="inspection-progress"><div><ShieldCheck size={17} /><span>確認済み <strong>{inspectionCount}</strong> / {inspectionKeys.length} 項目</span></div><span className={inspectionCount === inspectionKeys.length ? "complete" : ""}>{inspectionCount === inspectionKeys.length ? "全項目確認済み" : "確認を続けてください"}</span></div>
        <div className="inspection-form-list">
          {inspectionGroups.map((group) => <div className="inspection-form-group" key={group.name}><h3>{group.name}</h3>{group.items.map((item) => {
            const key = `${group.name}:${item}`;
            return <button type="button" key={key} className={data.inspection[key] ? "is-checked" : ""} onClick={() => set("inspection", { ...data.inspection, [key]: !data.inspection[key] })}><span>{data.inspection[key] && <Check size={13} />}</span>{item}</button>;
          })}</div>)}
        </div>
      </Section>

      <Section number="03" title="車両傷チェック" subtitle="車両シルエットを直接クリックしてください">
        <div className="damage-form-info"><CircleAlert size={16} /><p>傷や気になる箇所をクリックすると赤丸で記録します。<br />既存の赤丸をクリックすると、そのマークを削除できます。</p><strong>{data.damages.length} 件</strong></div>
        <DamageCanvas marks={data.damages} onChange={(damages) => set("damages", damages)} />
        <div className="damage-form-actions"><button type="button" onClick={() => set("damages", [])} disabled={data.damages.length === 0}><Eraser size={15} />傷マークをすべて消去</button><span>座標は日報データとともに保存されます。</span></div>
      </Section>

      <Section number="04" title="運行記録" subtitle="最大4回分の運行を帳票へ記載できます">
        <div className="record-note"><Plus size={15} />帳票には4回分の記録枠を固定で用意しています。不要な枠は空欄のままで構いません。</div>
        <div className="records-stack">{data.records.map((record, index) => <RecordEditor key={index} record={record} index={index} onChange={(next) => changeRecord(index, next)} />)}</div>
      </Section>
    </div>
  );
}
