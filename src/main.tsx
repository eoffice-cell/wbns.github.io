import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">WBNS E-OFFICE</p>
        <h1>ระบบสารบรรณอิเล็กทรอนิกส์</h1>
        <p>โรงเรียนวัดบึงน้ำใส</p>
        <p className="muted">ฐานระบบเริ่มต้นพร้อม Supabase Auth, RLS และโครงสร้างงานสารบรรณ</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
