import { FormEvent, useEffect, useState } from "react";
import type { Database } from "../../types/database";
import { approveDocument, assignDocument, createDocument, getMyRoles, listActiveProfiles, listDocuments, listWorkflow, transitionDocument, type DocumentForm } from "./documentService";

type Direction = Database["public"]["Enums"]["document_direction"];
type Urgency = Database["public"]["Enums"]["document_urgency"];
type Document = Database["public"]["Tables"]["documents"]["Row"];

const urgencyLabels: Record<Urgency, string> = { normal: "ปกติ", urgent: "ด่วน", very_urgent: "ด่วนมาก", most_urgent: "ด่วนที่สุด" };
const statusLabels: Record<Document["status"], string> = {
  draft: "ร่าง", received: "รับเรื่องแล้ว", registered: "ลงทะเบียนแล้ว", assigned: "มอบหมายแล้ว",
  in_progress: "กำลังดำเนินการ", pending_approval: "รออนุมัติ", approved: "อนุมัติแล้ว",
  sent: "ส่งแล้ว", completed: "เสร็จสิ้น", archived: "จัดเก็บแล้ว", cancelled: "ยกเลิก",
};

const emptyForm = (direction: Direction): DocumentForm => ({
  direction,
  document_date: new Date().toISOString().slice(0, 10),
  received_date: direction === "incoming" ? new Date().toISOString().slice(0, 10) : "",
  sender_agency: "", sender_document_number: "", subject: "", urgency: "normal", notes: "",
});

function formatThaiNumber(document: Document) {
  return document.registration_number ?? document.document_number ?? "ยังไม่ออกเลข";
}

export function DocumentsPage({ userId }: { userId: string }) {
  const [direction, setDirection] = useState<Direction>("incoming");
  const [rows, setRows] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<DocumentForm>(emptyForm("incoming"));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Document | null>(null);
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string; position_title: string | null }>>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<Array<{ id: string; from_status: Document["status"] | null; to_status: Document["status"]; action_at: string; comment: string | null }>>([]);
  const [assignee, setAssignee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [comment, setComment] = useState("");
  const privileged = roles.some((role) => ["system_admin", "school_admin", "director", "deputy_director", "registry_officer"].includes(role));

  async function load() {
    setLoading(true);
    try { setRows(await listDocuments(direction, search)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดทะเบียนหนังสือได้"); }
    finally { setLoading(false); }
  }

  useEffect(() => { setForm(emptyForm(direction)); void load(); }, [direction]);
  useEffect(() => {
    void Promise.all([getMyRoles(userId), listActiveProfiles()]).then(([myRoles, activeProfiles]) => {
      setRoles(myRoles); setProfiles(activeProfiles);
    }).catch((error) => setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้"));
  }, [userId]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      await createDocument(form, userId);
      setMessage(direction === "incoming" ? "บันทึกหนังสือรับแล้ว ระบบจะออกเลขทะเบียนเมื่อเข้าสถานะลงทะเบียน" : "บันทึกหนังสือส่งฉบับร่างแล้ว ระบบจะออกเลขหนังสือเมื่อเข้าสถานะส่งแล้ว");
      setForm(emptyForm(direction)); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  }

  async function openDocument(document: Document) {
    setSelected(document);
    setAssignee(document.assigned_to ?? "");
    setDeadline(document.deadline_at ? new Date(document.deadline_at).toISOString().slice(0, 16) : "");
    setAssignmentNotes(""); setComment("");
    try { setWorkflow(await listWorkflow(document.id)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดประวัติการดำเนินงานได้"); }
  }

  async function refreshSelected() {
    if (!selected) return;
    await load();
    const refreshed = (await listDocuments(selected.direction, "")).find((row) => row.id === selected.id);
    if (refreshed) await openDocument(refreshed);
  }

  async function saveAssignment() {
    if (!selected || !assignee) return;
    try {
      await assignDocument(selected.id, assignee, userId, deadline ? new Date(deadline).toISOString() : null, assignmentNotes || null);
      setMessage("มอบหมายงานเรียบร้อย"); await refreshSelected();
    } catch (error) { setMessage(error instanceof Error ? error.message : "มอบหมายงานไม่สำเร็จ"); }
  }

  async function changeStatus(status: Document["status"]) {
    if (!selected) return;
    try { await transitionDocument(selected.id, status); setMessage("เปลี่ยนสถานะเรียบร้อย"); await refreshSelected(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "เปลี่ยนสถานะไม่สำเร็จ"); }
  }

  async function decide(decision: "approved" | "rejected") {
    if (!selected) return;
    try {
      await approveDocument(selected.id, userId, decision, comment);
      setMessage(decision === "approved" ? "อนุมัติเอกสารแล้ว" : "ส่งกลับให้ดำเนินการแก้ไขแล้ว"); await refreshSelected();
    } catch (error) { setMessage(error instanceof Error ? error.message : "บันทึกผลการอนุมัติไม่สำเร็จ"); }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div><p className="eyebrow">ทะเบียนสารบรรณ</p><h2>{direction === "incoming" ? "หนังสือรับ" : "หนังสือส่ง"}</h2><p className="muted">เลขหนังสือถูกสร้างโดยฐานข้อมูลตาม “ลงวันที่” และปีพุทธศักราช</p></div>
        <div className="segmented"><button className={direction === "incoming" ? "active" : ""} onClick={() => setDirection("incoming")}>หนังสือรับ</button><button className={direction === "outgoing" ? "active" : ""} onClick={() => setDirection("outgoing")}>หนังสือส่ง</button></div>
      </div>
      <div className="content-grid">
        <form className="panel form-grid" onSubmit={submit}>
          <div className="panel-title">ลงทะเบียนรายการใหม่</div>
          <label>ลงวันที่<input type="date" required value={form.document_date} onChange={(e) => setForm({ ...form, document_date: e.target.value })} /></label>
          {direction === "incoming" && <label>วันที่รับ<input type="date" value={form.received_date ?? ""} onChange={(e) => setForm({ ...form, received_date: e.target.value })} /></label>}
          <label>หน่วยงานผู้ส่ง<input value={form.sender_agency ?? ""} onChange={(e) => setForm({ ...form, sender_agency: e.target.value })} /></label>
          <label>เลขที่หนังสือจากหน่วยงานผู้ส่ง<input value={form.sender_document_number ?? ""} onChange={(e) => setForm({ ...form, sender_document_number: e.target.value })} /></label>
          <label className="full">เรื่อง<input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
          <label>ความเร่งด่วน<select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as Urgency })}>{Object.entries(urgencyLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="full">หมายเหตุ<textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="full form-actions"><button className="primary" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกรายการ"}</button></div>
          {message && <div className="notice full">{message}</div>}
        </form>
        <div className="panel">
          <div className="panel-title">ทะเบียนล่าสุด</div>
          <div className="toolbar"><input placeholder="ค้นหาเลขทะเบียน / เรื่อง / หน่วยงาน" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load()} /><button onClick={() => void load()} disabled={loading}>ค้นหา</button></div>
          {loading ? <p className="muted">กำลังโหลด...</p> : rows.length === 0 ? <div className="empty-state">ยังไม่มีรายการ</div> : (
            <div className="table-wrap"><table><thead><tr><th>เลขทะเบียน/เลขหนังสือ</th><th>ลงวันที่</th><th>เรื่อง</th><th>ผู้ส่ง</th><th>ความเร่งด่วน</th><th>สถานะ</th><th>การดำเนินการ</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id}><td className="number-cell">{formatThaiNumber(row)}</td><td>{row.document_date ?? "-"}</td><td>{row.subject}</td><td>{row.sender_agency ?? "-"}</td><td>{urgencyLabels[row.urgency]}</td><td>{statusLabels[row.status]}</td><td><button className="small-button" onClick={() => void openDocument(row)}>เปิด</button></td></tr>)}</tbody>
            </table></div>
          )}
        </div>
      </div>

      {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
        <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
          <div className="page-heading"><div><p className="eyebrow">รายละเอียดหนังสือ</p><h3>{formatThaiNumber(selected)}</h3><p className="muted">{selected.subject}</p></div><button className="small-button" onClick={() => setSelected(null)}>ปิด</button></div>
          <div className="detail-grid">
            <div><strong>หน่วยงานผู้ส่ง</strong><span>{selected.sender_agency ?? "-"}</span></div>
            <div><strong>ลงวันที่</strong><span>{selected.document_date ?? "-"}</span></div>
            <div><strong>ความเร่งด่วน</strong><span>{urgencyLabels[selected.urgency]}</span></div>
            <div><strong>สถานะ</strong><span>{statusLabels[selected.status]}</span></div>
            <div><strong>กำหนดส่ง</strong><span>{selected.deadline_at ? new Date(selected.deadline_at).toLocaleString("th-TH") : "-"}</span></div>
            <div><strong>Drive</strong><span>{selected.drive_web_url ? <a href={selected.drive_web_url} target="_blank" rel="noreferrer">เปิดไฟล์</a> : "ยังไม่ได้เชื่อมไฟล์"}</span></div>
          </div>

          {privileged && <div className="panel nested-panel">
            <div className="panel-title">มอบหมายงาน</div>
            <div className="form-grid">
              <label>ผู้รับผิดชอบ<select value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">เลือกผู้รับผิดชอบ</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name}{profile.position_title ? " — " + profile.position_title : ""}</option>)}</select></label>
              <label>กำหนดส่ง<input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
              <label className="full">หมายเหตุการมอบหมาย<textarea rows={2} value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} /></label>
              <div className="full form-actions"><button className="primary" disabled={!assignee} onClick={() => void saveAssignment()}>มอบหมายงาน</button></div>
            </div>
          </div>}

          <div className="panel nested-panel">
            <div className="panel-title">การดำเนินงาน</div>
            <div className="toolbar"><select value={selected.status} onChange={(e) => void changeStatus(e.target.value as Document["status"])} disabled={!privileged}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
            {selected.status === "pending_approval" && privileged && <div className="form-grid"><label className="full">ความเห็นผู้อนุมัติ<textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} /></label><div className="form-actions full"><button className="primary" onClick={() => void decide("approved")}>อนุมัติ</button><button onClick={() => void decide("rejected")}>ส่งกลับแก้ไข</button></div></div>}
          </div>

          <div className="panel nested-panel"><div className="panel-title">ประวัติ Workflow</div>{workflow.length === 0 ? <p className="muted">ยังไม่มีประวัติ</p> : <div className="timeline">{workflow.map((item) => <div className="timeline-item" key={item.id}><strong>{statusLabels[item.to_status]}</strong><span>{new Date(item.action_at).toLocaleString("th-TH")}</span>{item.comment && <p>{item.comment}</p>}</div>)}</div>}</div>
        </div>
      </div>}
    </section>
  );
}
