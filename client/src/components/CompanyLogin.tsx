import { useState } from "react";
import { Building2, KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CompanyLogin({ onLoggedIn }: { onLoggedIn: () => Promise<void> | void }) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.company.login.useMutation({
    onSuccess: async () => {
      await onLoggedIn();
      toast.success("社内日報システムへログインしました");
    },
    onError: (error) => toast.error("ログインできませんでした", { description: error.message }),
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ loginId, password });
  };

  return (
    <main className="company-login-page">
      <section className="company-login-card">
        <div className="company-login-mark"><Building2 size={24} /></div>
        <p className="company-login-eyebrow">COMPANY DRIVER'S LOG</p>
        <h1>運転日報管理</h1>
        <p className="company-login-description">社員共通のIDとパスワードでログインしてください。</p>
        <form onSubmit={submit} className="company-login-form">
          <label><span>共通ID</span><div><Building2 size={16} /><input value={loginId} onChange={(event) => setLoginId(event.target.value)} autoComplete="username" required /></div></label>
          <label><span>パスワード</span><div><KeyRound size={16} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div></label>
          <button type="submit" disabled={login.isPending}><LogIn size={17} />{login.isPending ? "確認中…" : "ログイン"}</button>
        </form>
        <div className="company-login-note"><ShieldCheck size={15} />パスワード変更後は再ログインが必要です。</div>
      </section>
    </main>
  );
}
