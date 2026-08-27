import { useCallback, useState } from "react";
import { CheckCircle2, ChevronDown, FilePlus2, FileText, LogIn, PanelRightOpen, Printer, Save, UserRound } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import ReportForm from "@/components/ReportForm";
import ReportPreview from "@/components/ReportPreview";
import { trpc } from "@/lib/trpc";
import { createInitialReport, type ReportData } from "@shared/report";
import { toast } from "sonner";

type WorkspaceMode = "edit" | "preview";

export default function Home() {
  const [data, setData] = useState<ReportData>(createInitialReport);
  const [mode, setMode] = useState<WorkspaceMode>("edit");
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const reports = trpc.reports.list.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
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
      toast.message("保存にはログインが必要です", { description: "ログイン後、サーバー側データベースへ日報を保存できます。" });
      startLogin();
      return;
    }
    saveReport.mutate(data);
  };

  const savedReports = reports.data ?? [];
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

  return (
    <>
      <div className="app-shell screen-only">
        <header className="app-header">
          <div className="app-header-inner">
            <div className="brand-lockup"><span className="brand-mark"><FileText size={19} /></span><div><p>DRIVER'S LOG</p><h1>運転日報管理</h1></div></div>
            <div className="header-actions">
              {isAuthenticated ? <span className="user-status"><UserRound size={15} />{user?.name || "ログイン中"}</span> : <button type="button" className="login-action" onClick={startLogin} disabled={loading}><LogIn size={15} />ログインして保存</button>}
              <button type="button" className="secondary-action" onClick={handlePrint}><Printer size={16} />PDF保存（印刷）</button>
              <button type="button" className="primary-action" onClick={handleSave} disabled={saveReport.isPending || loading}><Save size={16} />{saveReport.isPending ? "保存中…" : "日報を保存"}</button>
            </div>
          </div>
          <div className="app-subheader">
            <div className="workspace-tabs"><button type="button" className={mode === "edit" ? "is-active" : ""} onClick={() => setMode("edit")}><FileText size={15} />入力</button><button type="button" className={mode === "preview" ? "is-active" : ""} onClick={() => setMode("preview")}><PanelRightOpen size={15} />帳票プレビュー</button></div>
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
