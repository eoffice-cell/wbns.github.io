import { useState } from "react";
import { registerPushServiceWorker } from "../../lib/push";

export function PushSettings() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true); setStatus("");
    try {
      const result = await registerPushServiceWorker();
      if (!result.supported) setStatus("เบราว์เซอร์นี้ไม่รองรับ Web Push");
      else if (result.subscribed) setStatus("เปิดการแจ้งเตือนบนอุปกรณ์นี้แล้ว");
      else if (result.reason === "missing_public_key") setStatus("ยังไม่ได้ตั้งค่า VAPID Public Key ของโรงเรียน");
      else if (result.reason === "permission_denied") setStatus("ไม่ได้รับอนุญาตการแจ้งเตือน");
      else setStatus("กรุณาเข้าสู่ระบบก่อนเปิดการแจ้งเตือน");
    } catch (e) { setStatus(e instanceof Error ? e.message : "เปิดการแจ้งเตือนไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  return <div className="panel nested-panel"><div className="panel-title">การแจ้งเตือนบนมือถือ/เบราว์เซอร์</div><p className="muted">เปิด Web Push บนอุปกรณ์นี้เพื่อรับแจ้งเตือนงานและกำหนดส่ง</p><button className="primary" disabled={busy} onClick={() => void enable()}>{busy ? "กำลังตั้งค่า..." : "เปิดการแจ้งเตือน"}</button>{status && <div className="notice">{status}</div>}</div>;
}
