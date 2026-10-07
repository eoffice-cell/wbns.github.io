# ระบบสารบรรณอิเล็กทรอนิกส์ โรงเรียนวัดบึงน้ำใส

## Phase 1 — Architecture Baseline

### Infrastructure
- GitHub: e-office-cell/wbns.github.io
- Supabase project: wbns-eoffice
- Supabase ref: flpdlkqgfxxeviilkacw
- PostgreSQL: Supabase PostgreSQL 17
- Region: ap-southeast-1 (Singapore)
- Document files: Google Drive (not Supabase Storage by default)
- Frontend: PWA, responsive, Thai-first
- Backend: Supabase Database + Auth + Edge Functions
- Notifications: Web Push/VAPID

### Security principles
1. School-owned infrastructure only.
2. No credentials are hardcoded in source control.
3. RLS is mandatory for application tables.
4. Server-side privileged operations use Edge Functions and secrets.
5. Audit logging is append-oriented and protected from ordinary user updates.
6. Google Drive access is scoped to the school's configured Drive resources.
7. No cross-school data or credentials.

### Roles
- system_admin
- school_admin
- director
- deputy_director
- registry_officer
- teacher
- staff

### Core modules
- Authentication / password reset
- User, role and permission management
- Dashboard
- Incoming correspondence
- Outgoing correspondence
- Registry / registration numbers
- Assignment and workflow
- Review and approval
- Deadlines
- Notifications / mobile push
- Google Drive document links
- Search / filtering
- Reports
- Audit log
- Legacy data import

### Urgency
- ปกติ
- ด่วน
- ด่วนมาก
- ด่วนที่สุด

### Minimum correspondence states
- ร่าง
- รับเรื่องแล้ว
- ลงทะเบียนแล้ว
- มอบหมายแล้ว
- กำลังดำเนินการ
- รออนุมัติ
- อนุมัติแล้ว
- ส่งแล้ว
- เสร็จสิ้น
- จัดเก็บแล้ว
- ยกเลิก

### Notification policy
Director and Deputy Director: important system/workflow events.
Teacher and Staff: assigned tasks and approaching deadlines only.

### Database design direction
Use normalized relational tables, UUID primary keys, explicit foreign keys and check constraints, indexed foreign keys and common search/filter columns. Avoid storing document binaries in PostgreSQL.

### Delivery gates
1. Infrastructure verification
2. Architecture approval
3. Database migrations + RLS
4. Auth and role model
5. Core correspondence workflow
6. Google Drive integration
7. Notifications / PWA
8. Search / reports / audit
9. Legacy import
10. Automated/manual testing
11. Deployment and recovery documentation

### Known blockers
- Google Drive connector is unavailable in the current environment, so the supplied Drive folder cannot yet be independently inspected.
- Google Cloud project ownership/configuration is not yet verified.
- OAuth credentials are not provisioned/verified.
- VAPID credentials are not provisioned/verified.

No production schema or user data is created by this architecture document.
