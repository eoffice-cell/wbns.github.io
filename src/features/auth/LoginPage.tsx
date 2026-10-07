import { FormEvent, useState } from "react";
import { signIn, sendPasswordReset } from "../../lib/auth";

export function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");const {error}=await signIn(email.trim(),password);setBusy(false);if(error)return setMessage(error.message);onSignedIn();}
  async function reset(){if(!email.trim())return setMessage("กรุณากรอกอีเมลก่อน");const {error}=await sendPasswordReset(email.trim());setMessage(error?"เกิดข้อผิดพลาด: "+error.message:"ส่งลิงก์ตั้งรหัสผ่านใหม่แล้ว");}
  return <main className="auth-shell"><form className="card auth-card" onSubmit={submit}><p className="eyebrow">WBNS E-OFFICE</p><h1>เข้าสู่ระบบ</h1><p className="muted">ระบบสารบรรณอิเล็กทรอนิกส์ โรงเรียนวัดบึงน้ำใส</p><label>อีเมล<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>รหัสผ่าน<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button disabled={busy}>{busy?"กำลังเข้าสู่ระบบ…":"เข้าสู่ระบบ"}</button><button type="button" className="link-button" onClick={reset}>ลืมรหัสผ่าน</button>{message&&<p className="error">{message}</p>}</form></main>;
}