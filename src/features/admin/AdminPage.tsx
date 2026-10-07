import { useEffect, useMemo, useState } from "react";
import type { Database } from "../../types/database";
import { assignRole, listProfilesWithRoles, removeRole } from "./adminService";

type Role = Database["public"]["Enums"]["app_role"];
const roleLabels: Record<Role, string> = { system_admin: "ผู้ดูแลระบบ", school_admin: "ผู้ดูแลโรงเรียน", director: "ผู้อำนวยการ", deputy_director: "รองผู้อำนวยการ", registry_officer: "เจ้าหน้าที่สารบรรณ", teacher: "ครู", staff: "บุคลากร" };
const roles = Object.keys(roleLabels) as Role[];

export function AdminPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listProfilesWithRoles>>>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() { try { setRows(await listProfilesWithRoles()); } catch (e) { setMessage(e instanceof Error ? e.message : "ไม่สามารถโหลดผู้ใช้งานได้"); } }
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => rows.filter((r) => `${r.full_name} ${r.email ?? ""} ${r.position_title ?? ""}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);

  async function toggleRole(userId: string, role: Role, hasRole: boolean) {
    setBusy(`${userId}:${role}`); setMessage("");
    try { hasRole ? await removeRole(userId, role) : await assignRole(userId, role); await load(); setMessage("บันทึกสิทธิ์เรียบร้อย"); }
    catch (e) { setMessage(e instanceof Error ? e.message : "ไม่สามารถบันทึกสิทธิ์ได้"); }
    finally { setBusy(null); }
  }

  return <section className="page-stack"><div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h2>ผู้ใช้งานและบทบาท</h2><p className="muted">จัดการบทบาทของบัญชีที่มีอยู่แล้วเท่านั้น ไม่สร้างบัญชี Auth โดยอัตโนมัติ</p></div></div>
    <div className="panel"><div className="toolbar"><input placeholder="ค้นหาชื่อ / อีเมล / ตำแหน่ง" value={search} onChange={(e) => setSearch(e.target.value)} /></div>{message && <div className="notice">{message}</div>}
      <div className="table-wrap"><table><thead><tr><th>ผู้ใช้งาน</th><th>สถานะ</th>{roles.map((r) => <th key={r}>{roleLabels[r]}</th>)}</tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td><strong>{row.full_name}</strong><div className="muted">{row.email ?? "ไม่มีอีเมล"}{row.position_title ? " · " + row.position_title : ""}</div></td><td>{row.is_active ? "ใช้งาน" : "ปิดใช้งาน"}</td>{roles.map((role) => { const has = row.roles.includes(role); const key = row.id + ":" + role; return <td key={role}><button className="small-button" disabled={busy === key} onClick={() => void toggleRole(row.id, role, has)}>{has ? "✓" : "+"}</button></td>; })}</tr>)}</tbody></table></div>
    </div></section>;
}
