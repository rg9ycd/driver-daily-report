import { useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Building2, CalendarDays, ChevronLeft, FileSearch, FileText, Filter, RotateCcw, Search, UserRound, X } from "lucide-react";
import CompanyLogin from "@/components/CompanyLogin";
import { trpc } from "@/lib/trpc";

type SortKey = "reportDate" | "vehicleNumber" | "sq" | "driver" | "updatedAt";

type SearchFilters = {
  dateFrom: string;
  dateTo: string;
  vehicleNumber: string;
  sq: string;
  driver: string;
  siteName: string;
  sortBy: SortKey;
  sortDirection: "asc" | "desc";
};

const initialFilters: SearchFilters = {
  dateFrom: "",
  dateTo: "",
  vehicleNumber: "",
  sq: "",
  driver: "",
  siteName: "",
  sortBy: "updatedAt",
  sortDirection: "desc",
};

function SortHeader({ label, sortKey, filters, onSort }: { label: string; sortKey: SortKey; filters: SearchFilters; onSort: (key: SortKey) => void }) {
  const active = filters.sortBy === sortKey;
  return <button type="button" onClick={() => onSort(sortKey)} className={`list-sort-button ${active ? "is-active" : ""}`}>{label}{active ? filters.sortDirection === "asc" ? <ArrowUpAZ size={13} /> : <ArrowDownAZ size={13} /> : <ArrowDownAZ size={13} />}</button>;
}

export default function ReportsList() {
  const utils = trpc.useUtils();
  const companyStatus = trpc.company.status.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const isAuthenticated = Boolean(companyStatus.data?.authenticated);
  const reports = trpc.reports.list.useQuery(filters, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
  const hasFilter = useMemo(() => Object.entries(filters).some(([key, value]) => !["sortBy", "sortDirection"].includes(key) && Boolean(value)), [filters]);

  const runSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters(draft);
  };
  const reset = () => {
    setDraft(initialFilters);
    setFilters(initialFilters);
  };
  const changeSort = (sortBy: SortKey) => setFilters(current => ({
    ...current,
    sortBy,
    sortDirection: current.sortBy === sortBy && current.sortDirection === "desc" ? "asc" : "desc",
  }));

  if (companyStatus.isLoading) return <div className="company-loading">社内日報システムを確認しています…</div>;
  if (!companyStatus.data?.configured) return <div className="company-loading">共通ログインの設定が完了していません。管理者へ連絡してください。</div>;
  if (!isAuthenticated) return <CompanyLogin onLoggedIn={async () => { await utils.company.status.invalidate(); await utils.reports.list.invalidate(); }} />;

  return (
    <main className="reports-page">
      <header className="reports-header">
        <a href="/" className="reports-brand"><span><FileText size={18} /></span><div><p>DRIVER'S LOG</p><strong>運転日報管理</strong></div></a>
        <a href="/" className="reports-back"><ChevronLeft size={16} />帳票入力へ戻る</a>
      </header>
      <section className="reports-content">
        <div className="reports-heading"><div><p>REPORT ARCHIVE</p><h1>日報一覧</h1><span>保存済みの運転日報を条件指定で確認・再編集できます。</span></div><div className="reports-count"><FileSearch size={20} /><div><strong>{reports.data?.length ?? 0}</strong><span>件を表示</span></div></div></div>
        <form className="reports-filter" onSubmit={runSearch}>
          <div className="filter-title"><Filter size={16} />検索条件</div>
          <div className="filter-grid">
            <label><span>日付（開始）</span><input type="date" value={draft.dateFrom} onChange={event => setDraft({ ...draft, dateFrom: event.target.value })} /></label>
            <label><span>日付（終了）</span><input type="date" value={draft.dateTo} onChange={event => setDraft({ ...draft, dateTo: event.target.value })} /></label>
            <label><span>車両番号</span><input value={draft.vehicleNumber} placeholder="例：102" onChange={event => setDraft({ ...draft, vehicleNumber: event.target.value })} /></label>
            <label><span>SQ</span><input value={draft.sq} placeholder="例：SQ-01" onChange={event => setDraft({ ...draft, sq: event.target.value })} /></label>
            <label><span>運転者</span><input value={draft.driver} placeholder="氏名で検索" onChange={event => setDraft({ ...draft, driver: event.target.value })} /></label>
            <label><span>現場名</span><input value={draft.siteName} placeholder="現場名で検索" onChange={event => setDraft({ ...draft, siteName: event.target.value })} /></label>
          </div>
          <div className="filter-actions"><button type="button" onClick={reset} disabled={!hasFilter && !Object.values(draft).some((value, index) => index < 6 && Boolean(value))}><RotateCcw size={15} />条件をクリア</button><button type="submit"><Search size={16} />検索する</button></div>
        </form>
        <section className="reports-table-card">
          <div className="reports-table-hint"><CalendarDays size={15} />見出しを押すと昇順・降順を切り替えます。</div>
          <div className="reports-table-wrap"><table className="reports-table"><thead><tr><th><SortHeader label="日付" sortKey="reportDate" filters={filters} onSort={changeSort} /></th><th><SortHeader label="車両番号" sortKey="vehicleNumber" filters={filters} onSort={changeSort} /></th><th><SortHeader label="SQ" sortKey="sq" filters={filters} onSort={changeSort} /></th><th><SortHeader label="運転者" sortKey="driver" filters={filters} onSort={changeSort} /></th><th>現場名</th><th>状況確認者</th><th><SortHeader label="更新日時" sortKey="updatedAt" filters={filters} onSort={changeSort} /></th><th>操作</th></tr></thead><tbody>{reports.isLoading ? <tr><td colSpan={8} className="reports-state">日報データを読み込んでいます…</td></tr> : reports.data?.length ? reports.data.map(report => <tr key={report.id}><td>{report.data.date}</td><td className="number-cell">{report.data.vehicleNumber || "—"}</td><td>{report.data.sq || "—"}</td><td><span className="driver-cell"><UserRound size={13} />{report.drivers || "—"}</span></td><td>{report.data.siteName || "—"}</td><td>{report.data.confirmer || "—"}</td><td>{new Date(report.updatedAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td><td><a href={`/?report=${encodeURIComponent(report.id)}`}>開く</a></td></tr>) : <tr><td colSpan={8} className="reports-empty"><Search size={25} /><strong>該当する日報はありません</strong><span>検索条件を変更するか、帳票入力画面から新しい日報を保存してください。</span></td></tr>}</tbody></table></div>
        </section>
      </section>
    </main>
  );
}
