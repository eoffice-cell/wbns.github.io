import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./lib/supabase";
import { getCurrentUser, signOut } from "./lib/auth";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { NotificationCenter } from "./features/notifications/NotificationCenter";
import { AdminPage } from "./features/admin/AdminPage";
import { AuditLogPage } from "./features/admin/AuditLogPage";
import { getMyRoles } from "./features/documents/documentService";
import "./styles.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState<"dashboard" | "documents" | "notifications" | "admin" | "audit">("dashboard");
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    getCurrentUser().then(({ user }) => { setUser(user); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <main className="auth-shell"><p>กำลังตรวจสอบการเข้าสู่ระบบ…</p></main>;
  if (!user) return <LoginPage onSignedIn={() => getCurrentUser().then(({ user }) => setUser(user))}/>;
  const canAdmin = roles.some((role) => ["system_admin", "school_admin"].includes(role));

  useEffect(() => { if (user) void getMyRoles(user.id).then(setRoles).catch(() => setRoles([])); }, [user]);

  return <div>
    <nav className="main-nav">
      <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>ภาพรวม</button>
      <button className={page === "documents" ? "active" : ""} onClick={() => setPage("documents")}>ทะเบียนหนังสือ</button>
      <button className={page === "notifications" ? "active" : ""} onClick={() => setPage("notifications")}>แจ้งเตือน</button>
      {canAdmin && <><button className={page === "admin" ? "active" : ""} onClick={() => setPage("admin")}>ผู้ใช้งาน</button><button className={page === "audit" ? "active" : ""} onClick={() => setPage("audit")}>Audit Log</button></>}
      <button className="logout-nav" onClick={async () => { await signOut(); setUser(null); setRoles([]); }}>ออกจากระบบ</button>
    </nav>
    {page === "dashboard" && <DashboardPage onLogout={() => setUser(null)} />}
    {page === "documents" && <main className="app-shell"><DocumentsPage userId={user.id}/></main>}
    {page === "notifications" && <main className="app-shell"><NotificationCenter userId={user.id}/></main>}
    {page === "admin" && canAdmin && <main className="app-shell"><AdminPage /></main>}
    {page === "audit" && canAdmin && <main className="app-shell"><AuditLogPage /></main>}
  </div>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
