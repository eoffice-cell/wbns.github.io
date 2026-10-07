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
