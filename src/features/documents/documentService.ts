import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type Direction = Database["public"]["Enums"]["document_direction"];
type Urgency = Database["public"]["Enums"]["document_urgency"];

export type DocumentForm = {
  direction: Direction;
  document_date: string;
  received_date?: string;
  sender_agency?: string;
  sender_document_number?: string;
  subject: string;
  urgency: Urgency;
  notes?: string;
};

export async function listDocuments(direction: Direction, search = "") {
  let query = supabase
    .from("documents")
    .select("*")
    .eq("direction", direction)
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (search.trim()) {
    const term = search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `subject.ilike.%${term}%,sender_agency.ilike.%${term}%,registration_number.ilike.%${term}%,document_number.ilike.%${term}%,sender_document_number.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function createDocument(form: DocumentForm, userId: string) {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      direction: form.direction,
      document_date: form.document_date || null,
      received_date: form.received_date || null,
      sender_agency: form.sender_agency || null,
      sender_document_number: form.sender_document_number || null,
      subject: form.subject.trim(),
      urgency: form.urgency,
      notes: form.notes?.trim() || null,
      created_by: userId,
      status: form.direction === "incoming" ? "received" : "draft",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Document;
}


export async function listActiveProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, position_title, email, is_active")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMyRoles(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.role);
}

export async function listWorkflow(documentId: string) {
  const { data, error } = await supabase
    .from("document_workflow")
    .select("*")
    .eq("document_id", documentId)
    .order("action_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function assignDocument(
  documentId: string,
  assignedTo: string,
  assignedBy: string,
  deadlineAt: string | null,
  notes: string | null,
) {
  const { error: assignmentError } = await supabase.from("document_assignments").insert({
    document_id: documentId,
    assigned_to: assignedTo,
    assigned_by: assignedBy,
    deadline_at: deadlineAt,
    notes,
  });
  if (assignmentError) throw assignmentError;

  const { error } = await supabase
    .from("documents")
    .update({
      assigned_to: assignedTo,
      assigned_at: new Date().toISOString(),
      deadline_at: deadlineAt,
      status: "assigned",
    })
    .eq("id", documentId);
  if (error) throw error;
}

export async function transitionDocument(
  documentId: string,
  toStatus: Database["public"]["Enums"]["document_status"],
) {
  const { error } = await supabase
    .from("documents")
    .update({ status: toStatus })
    .eq("id", documentId);
  if (error) throw error;
}

export async function approveDocument(
  documentId: string,
  approverId: string,
  decision: "approved" | "rejected",
  comment: string,
) {
  const { error: approvalError } = await supabase.from("document_approvals").insert({
    document_id: documentId,
    approver_id: approverId,
    decision,
    comment: comment.trim() || null,
  });
  if (approvalError) throw approvalError;

  await transitionDocument(documentId, decision === "approved" ? "approved" : "in_progress");
}
