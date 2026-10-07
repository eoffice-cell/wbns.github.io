import { useEffect, useMemo, useState } from "react";
import { listAuditLogs } from "./adminService";

export function AuditLogPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAuditLogs>>>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { listAuditLogs().then(setRows).catch((e) => setError(e instanceof Error ? e.message : "ไม่สามารถโหลด Audit Log ได้")); }, []);
  const filtered = useMemo(() => rows.filter((r) => `${r.action} ${r.entity_type} ${r.entity_id ?? ""} ${r.actor_id ?? ""}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  return <section className="page-stack"><div className="page-heading"><div><p className="eyebrow">AUDIT LOG</p><h2>ประวัติการใช้งาน</h2><p className="muted">ข้อมูลอ่านอย่างเดียวสำหรับตรวจสอบย้อนหลัง</p></div></div><div className="panel"><div className="toolbar"><input placeholder="ค้นหา action / entity / ID" value={search} onChange={(e) => setSearch(e.target.value)} /></div>{error ? <p className="error">{error}</p> : <div className="table-wrap"><table><thead><tr><th>เวลา</th><th>ผู้กระทำ</th><th>Action</th><th>Entity</th><th>ID</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td>{new Date(r.created_at).toLocaleString("th-TH")}</td><td className="mono">{r.actor_id ?? "system"}</td><td>{r.action}</td><td>{r.entity_type}</td><td className="mono">{r.entity_id ?? "-"}</td></tr>)}</tbody></table></div>}</div></section>;
}
