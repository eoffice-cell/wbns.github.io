import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "./notificationService";

const labels: Record<string, string> = {
  document_created: "หนังสือใหม่",
  task_assigned: "มอบหมายงาน",
  deadline_changed: "กำหนดส่ง",
  status_changed: "สถานะเปลี่ยน",
  deadline_approaching: "ใกล้ครบกำหนด",
};

export function NotificationCenter({ userId }: { userId: string }) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listNotifications>>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { setItems(await listNotifications(userId)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถโหลดการแจ้งเตือนได้"); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => {
    void refresh();
    const channel = supabase.channel(`notifications-${userId}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => setItems((current) => [payload.new as typeof current[number], ...current].slice(0, 50)),
    ).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh, userId]);

  const unread = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  async function read(id: string) {
    await markNotificationRead(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item));
  }

  async function readAll() {
    await markAllNotificationsRead(userId);
    setItems((current) => current.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() })));
  }

  return <section className="card notification-card">
    <div className="page-heading">
      <div><p className="eyebrow">NOTIFICATIONS</p><h2>การแจ้งเตือน {unread > 0 && <span className="badge">{unread}</span>}</h2></div>
      {unread > 0 && <button className="small-button" onClick={() => void readAll()}>อ่านทั้งหมด</button>}
    </div>
    {error && <p className="error">{error}</p>}
    {loading ? <p className="muted">กำลังโหลด…</p> : items.length === 0 ? <p className="muted">ยังไม่มีการแจ้งเตือน</p> :
      <div className="notification-list">{items.map((item) => <article key={item.id} className={`notification-item ${item.is_read ? "" : "unread"}`}>
        <div><span className="notification-type">{labels[item.type] ?? item.type}</span><strong>{item.title}</strong>{item.body && <p>{item.body}</p>}<time>{new Date(item.created_at).toLocaleString("th-TH")}</time></div>
        {!item.is_read && <button className="small-button" onClick={() => void read(item.id)}>อ่านแล้ว</button>}
      </article>)}</div>}
  </section>;
}
