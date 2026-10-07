# Workflow Security Baseline

## Document status transition policy

The database enforces a finite state machine for correspondence:

- draft -> received, cancelled
- received -> registered, cancelled
- registered -> assigned, cancelled
- assigned -> in_progress, cancelled
- in_progress -> pending_approval, completed, cancelled
- pending_approval -> approved, in_progress, cancelled
- approved -> sent, completed, cancelled
- sent -> completed, archived
- completed -> archived

The database rejects undefined transitions.

## Authorization

For document updates:
- System Admin / School Admin / Director / Deputy Director / Registry Officer retain normal document-edit privileges.
- A document creator or assigned user may update the document only within the restricted workflow surface.
- Restricted users cannot alter registry identifiers, sender information, subject, direction, Drive references, creator, or assignment fields through an ordinary update.
- Status changes are validated by a database trigger before the update is accepted.

## Audit

Status changes create a document_workflow record with document, previous status, next status, acting user, and note.
Core document mutations are also captured by protected audit triggers.

## Security verification

Supabase Security Advisor currently reports 0 security lints after the workflow hardening.

No real school users or document records are required to install this layer.
