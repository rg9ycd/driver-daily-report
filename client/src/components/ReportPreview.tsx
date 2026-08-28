import React from "react";
import type { ReportData, RouteRecord } from "@shared/report";
import { formatReportDate, formatVehicleNumber, inspectionGroups, PRE_OPERATION_INSPECTION_LABEL } from "@shared/report";
import DamageCanvas from "./DamageCanvas";

function FilledLine({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`filled-line ${className}`}>
      {label && <span>{label}</span>}
      <strong>{value}</strong>
    </div>
  );
}

function CellValue({ children }: { children: React.ReactNode }) {
  return <span className="record-cell-value">{children || "　"}</span>;
}

function RouteRecordPreview({ record, index, date }: { record: RouteRecord; index: number; date: string }) {
  return (
    <section className="route-record">
      <div className="record-top">
        <div>{formatReportDate(date)}</div>
        <div>{record.driver || "ドライバー"}</div>
        <div>{record.passenger || "同乗者"}</div>
        <div>記録番号&nbsp;{index}</div>
      </div>
      <div className="record-grid">
        <div className="record-label">発着地</div>
        <div className="record-label">時間</div>
        <div className="record-label">メーター</div>
        <div className="record-label">アルコールチェック</div>
        <div className="record-label">呼気中濃度</div>
        <div className="record-label">点呼者</div>
        <div className="record-line location-line"><small>（出発地）</small><CellValue>{record.departurePlace}</CellValue></div>
        <div className="record-line time-line"><CellValue>{record.departureTime || "："}</CellValue></div>
        <div className="record-line"><CellValue>{record.departureMeter ? `${record.departureMeter} km` : "　　　　　　 km"}</CellValue></div>
        <div className="record-line alcohol-line"><span>乗務前</span><i className={record.alcoholBefore ? "is-checked" : ""} /></div>
        <div className="record-line"><CellValue>{record.alcoholBeforeValue ? `${record.alcoholBeforeValue} mg/ℓ` : "　　　　　 mg/ℓ"}</CellValue></div>
        <div className="record-line"><CellValue>{record.rollCaller}</CellValue></div>
        <div className="record-line location-line"><small>（到着地）</small><CellValue>{record.arrivalPlace}</CellValue></div>
        <div className="record-line time-line"><CellValue>{record.arrivalTime || "："}</CellValue></div>
        <div className="record-line"><CellValue>{record.arrivalMeter ? `${record.arrivalMeter} km` : "　　　　　　 km"}</CellValue></div>
        <div className="record-line alcohol-line"><span>乗務後</span><i className={record.alcoholAfter ? "is-checked" : ""} /></div>
        <div className="record-line"><CellValue>{record.alcoholAfterValue ? `${record.alcoholAfterValue} mg/ℓ` : "　　　　　 mg/ℓ"}</CellValue></div>
        <div className="record-line" />
      </div>
    </section>
  );
}

function FrontPage({ data }: { data: ReportData }) {
  return (
    <article className="paper-page front-page">
      <header className="front-header">
        <div className="report-title-row">
          <FilledLine label="" value={formatVehicleNumber(data.vehicleNumber)} className="vehicle-line" />
          <div className="report-title-wrap">
            <p>DAILY DRIVER REPORT</p>
            <h1>運 転 日 報</h1>
          </div>
          <span className="report-edition">様式 01</span>
        </div>
        <div className="front-details-row">
          <FilledLine label="現場名" value={data.siteName} />
          <FilledLine label="SQ" value={data.sq} />
        </div>
      </header>
      <main className="route-list">
        {data.records.map((record, index) => <RouteRecordPreview key={index} record={record} index={index + 1} date={data.date} />)}
      </main>
      <footer className="page-footer">運行前後の確認事項は、裏面の車両運転前検査に記録してください。 <span>01 / 02</span></footer>
    </article>
  );
}

function BackPage({ data }: { data: ReportData }) {
  return (
    <article className="paper-page back-page">
      <header className="back-header">
        <div>
          <p>{PRE_OPERATION_INSPECTION_LABEL}</p>
          <h2>車両運転前検査</h2>
        </div>
        <FilledLine label="状況確認者" value={data.confirmer} className="confirmer-line" />
      </header>
      <div className="inspection-layout">
        <table className="inspection-table">
          <thead><tr><th>区分</th><th>点検内容</th></tr></thead>
          <tbody>
            {inspectionGroups.flatMap((group) => group.items.map((item, itemIndex) => {
              const key = `${group.name}:${item}`;
              return (
                <tr key={key}>
                  {itemIndex === 0 && <th rowSpan={group.items.length}>{group.name}</th>}
                  <td><span className={`inspection-box ${data.inspection[key] ? "is-done" : ""}`}>{data.inspection[key] ? "✓" : ""}</span>{item}</td>
                </tr>
              );
            }))}
          </tbody>
        </table>
        <section className="damage-report-box" aria-label="車両傷チェック欄">
          <div className="damage-report-heading"><span>車両傷チェック</span><small>異常箇所に赤丸を記入</small></div>
          <div className="damage-report-meta"><span><b>日付</b>{formatReportDate(data.date)}</span><span><b>現場名</b>{data.siteName || "未記入"}</span></div>
          <DamageCanvas marks={data.damages} readOnly />
          <div className="damage-caption"><span>傷マーク {data.damages.length} 件</span><span>異常時は速やかに報告</span></div>
        </section>
      </div>
      <footer className="back-note">※ 異常があった場合は、運行管理者へ速やかに報告してください。 <span>02 / 02</span></footer>
    </article>
  );
}

export default function ReportPreview({ data }: { data: ReportData }) {
  return <div className="report-document"><FrontPage data={data} /><BackPage data={data} /></div>;
}
