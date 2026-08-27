import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, FilePlus2, FileText, LogOut, PanelRightOpen, Printer, Save, TableProperties, UserRound } from "lucide-react";
import CompanyLogin from "@/components/CompanyLogin";
import ReportForm from "@/components/ReportForm";
import ReportPreview from "@/components/ReportPreview";
import { trpc } from "@/lib/trpc";
import { createInitialReport, type ReportData } from "@shared/report";
import { toast } from "sonner";

type WorkspaceMode = "edit" | "preview";

export default function Home() {
  const [data, setData] = useState<ReportData>(createInitialReport);
  const [mode, setMode] = useState<WorkspaceMode>("edit");
  const utils = trpc.useUtils();
  const companyStatus = trpc.company.status.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const isAuthenticated = Boolean(companyStatus.data?.authenticated);
  const reports = trpc.reports.list.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
  const logout = trpc.company.logout.useMutation({
    onSuccess: async () => {
      await utils.company.status.invalidate();
      utils.reports.list.setData(undefined, undefined);
      setData(createInitialReport());
      toast.message("ログアウトしました");
    },
  });
  const saveReport = trpc.reports.save.useMutation({
    onSuccess: async (saved) => {
      setData(saved);
      await utils.reports.list.invalidate();
      toast.success("日報を保存しました", { description: "傷マークの座標を含むすべての入力内容を保存しています。" });
    },
    onError: (error) => toast.error("保存できませんでした", { description: error.message }),
  });

  const handlePrint = useCallback(() => {
    setMode("preview");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
  }, []);

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.message("保存には社内ログインが必要です");
      return;
    }
    saveReport.mutate(data);
  };

  const savedReports = reports.data ?? [];
  const requestedReportId = new URLSearchParams(window.location.search).get("report");
  useEffect(() => {
    if (!requestedReportId || !savedReports.length) return;
    const selected = savedReports.find(report => report.id === requestedReportId);
    if (selected) setData(selected.data);
  }, [requestedReportId, savedReports]);
  const handleHistorySelect = (id: string) => {
    if (!id) {
      setData(createInitialReport());
      return;
    }
    const selected = savedReports.find((report) => report.id === id);
    if (selected) {
      setData(selected.data);
      toast.success("保存済みの日報を読み込みました");
    }
  };

  if (companyStatus.isLoading) return <div className="company-loading">社内日報システムを確認しています…</div>;
  if (!companyStatus.data?.configured) return <div className="company-loading">共通ログインの設定が完了していません。管理者へ連絡してください。</div>;
  if (!isAuthenticated) return <CompanyLogin onLoggedIn={async () => { await utils.company.status.invalidate(); await utils.reports.list.invalidate(); }} />;

  return (
    <>
      <div className="app-shell screen-only">
        <header className="app-header">
          <div className="app-header-inner">
            <div className="brand-lockup"><span className="brand-mark"><FileText size={19} /></span><div><p>DRIVER'S LOG</p><h1>運転日報管理</h1></div></div>
            <div className="header-actions">
              <span className="user-status"><UserRound size={15} />社内共通ログイン</span>
              <button type="button" className="secondary-action" onClick={handlePrint}><Printer size={16} />PDF保存（印刷）</button>
              <button type="button" className="primary-action" onClick={handleSave} disabled={saveReport.isPending}><Save size={16} />{saveReport.isPending ? "保存中…" : "日報を保存"}</button>
              <button type="button" className="logout-action" onClick={() => logout.mutate()} disabled={logout.isPending} aria-label="ログアウト"><LogOut size={16} /></button>
            </div>
          </div>
          <div className="app-subheader">
            <div className="workspace-tabs"><button type="button" className={mode === "edit" ? "is-active" : ""} onClick={() => setMode("edit")}><FileText size={15} />入力</button><button type="button" className={mode === "preview" ? "is-active" : ""} onClick={() => setMode("preview")}><PanelRightOpen size={15} />帳票プレビュー</button><a href="/reports"><TableProperties size={15} />日報一覧</a></div>
            <div className="history-tools"><button type="button" onClick={() => { setData(createInitialReport()); setMode("edit"); }}><FilePlus2 size={15} />新規作成</button>{isAuthenticated && <label className="history-select"><span>保存済み</span><select value={data.id ?? ""} onChange={(event) => handleHistorySelect(event.target.value)}><option value="">新しい日報</option>{savedReports.map((report) => <option value={report.id} key={report.id}>{report.data.date}｜{report.data.vehicleNumber || "号車未入力"}｜{report.data.siteName || "現場名未入力"}</option>)}</select><ChevronDown size={14} /></label>}</div>
          </div>
        </header>
        <main className={`workspace workspace-${mode}`}>
          <aside className="form-column"><div className="form-column-header"><div><span>INPUT FORM</span><h2>日報を入力</h2></div><p>入力内容は帳票に即時反映されます。</p></div><ReportForm data={data} onChange={setData} /></aside>
          <section className="preview-column"><div className="preview-toolbar"><div><span>LIVE PREVIEW</span><h2>A4横・表裏 2ページ</h2></div><div className="preview-status"><CheckCircle2 size={15} />リアルタイム反映中</div></div><div className="preview-scroll"><ReportPreview data={data} /></div></section>
        </main>
      </div>
      <div className="print-only"><ReportPreview data={data} /></div>
    </>
  );
}
