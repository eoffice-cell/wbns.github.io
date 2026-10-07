import { FormEvent, useEffect, useState } from "react";
import type { Database } from "../../types/database";
import { createDocument, listDocuments, type DocumentForm } from "./documentService";

type Direction = Database["public"]["Enums"]["document_direction"];
type Urgency = Database["public"]["Enums"]["document_urgency"];
type Document = Database["public"]["Tables"]["documents"]["Row"];

const urgencyLabels: Record<Urgency, string> = {
  normal: "ปกติ",
  urgent: "ด่วน",
  very_urgent: "ด่วนมาก",
  most_urgent: "ด่วนที่สุด",
};

const statusLabels: Record<Database["public"]["Enums"]["document_status"], string> = {
  draft: "ร่าง",
  received: "รับเรื่องแล้ว",
  registered: "ลงทะเบียนแล้ว",
  assigned: "มอบหมายแล้ว",
  in_progress: "กำลังดำเนินการ",
  pending_approval: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  sent: "ส่งแล้ว",
  completed: "เสร็จสิ้น",
  archived: "จัดเก็บแล้ว",
  cancelled: "ยกเลิก",
};

const emptyForm = (direction: Direction): DocumentForm => ({
  direction,
  document_date: new Date().toISOString().slice(0, 10),
  received_date: direction === "incoming" ? new Date().toISOString().slice(0, 10) : "",
  sender_agency: "",
  sender_document_number: "",
  subject: "",
  urgency: "normal",
  notes: "",
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

  async function load() {
    setLoading(true);
    try {
      setRows(await listDocuments(direction, search));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดทะเบียนหนังสือได้");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setForm(emptyForm(direction));
    void load();
  }, [direction]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await createDocument(form, userId);
      setMessage(
        direction === "incoming"
          ? "บันทึกหนังสือรับแล้ว ระบบจะออกเลขทะเบียนเมื่อเข้าสถานะลงทะเบียน"
          : "บันทึกหนังสือส่งฉบับร่างแล้ว ระบบจะออกเลขหนังสือเมื่อเข้าสถานะส่งแล้ว",
      );
      setForm(emptyForm(direction));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ทะเบียนสารบรรณ</p>
          <h2>{direction === "incoming" ? "หนังสือรับ" : "หนังสือส่ง"}</h2>
          <p className="muted">เลขหนังสือถูกสร้างโดยฐานข้อมูลตาม “ลงวันที่” และปีพุทธศักราช</p>
        </div>
        <div className="segmented">
          <button className={direction === "incoming" ? "active" : ""} onClick={() => setDirection("incoming")}>หนังสือรับ</button>
          <button className={direction === "outgoing" ? "active" : ""} onClick={() => setDirection("outgoing")}>หนังสือส่ง</button>
        </div>
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
          <div className="toolbar">
            <input placeholder="ค้นหาเลขทะเบียน / เรื่อง / หน่วยงาน" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load()} />
            <button onClick={() => void load()} disabled={loading}>ค้นหา</button>
          </div>
          {loading ? <p className="muted">กำลังโหลด...</p> : rows.length === 0 ? <div className="empty-state">ยังไม่มีรายการ</div> : (
            <div className="table-wrap"><table><thead><tr><th>เลขทะเบียน/เลขหนังสือ</th><th>ลงวันที่</th><th>เรื่อง</th><th>ผู้ส่ง</th><th>ความเร่งด่วน</th><th>สถานะ</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id}><td className="number-cell">{formatThaiNumber(row)}</td><td>{row.document_date ?? "-"}</td><td>{row.subject}</td><td>{row.sender_agency ?? "-"}</td><td>{urgencyLabels[row.urgency]}</td><td>{statusLabels[row.status]}</td></tr>)}</tbody>
            </table></div>
          )}
        </div>
      </div>
    </section>
  );
}
