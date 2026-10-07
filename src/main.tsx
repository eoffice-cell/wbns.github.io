import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./lib/supabase";
import { getCurrentUser, signOut } from "./lib/auth";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import "./styles.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState<"dashboard" | "documents">("dashboard");

  useEffect(() => {
    getCurrentUser().then(({ user }) => { setUser(user); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <main className="auth-shell"><p>กำลังตรวจสอบการเข้าสู่ระบบ…</p></main>;
  if (!user) return <LoginPage onSignedIn={() => getCurrentUser().then(({ user }) => setUser(user))}/>;

  return (
    <div>
      <nav className="main-nav">
        <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>ภาพรวม</button>
        <button className={page === "documents" ? "active" : ""} onClick={() => setPage("documents")}>ทะเบียนหนังสือ</button>
        <button className="logout-nav" onClick={async () => { await signOut(); setUser(null); }}>ออกจากระบบ</button>
      </nav>
      {page === "dashboard" ? <DashboardPage onLogout={() => setUser(null)} /> : <main className="app-shell"><DocumentsPage userId={user.id}/></main>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
