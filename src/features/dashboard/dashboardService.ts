import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

export type DashboardSummary =
  Database["public"]["Views"]["dashboard_document_summary"]["Row"];

export async function getDashboardSummary() {
  return supabase
    .from("dashboard_document_summary")
    .select("*")
    .order("status", { ascending: true })
    .order("urgency", { ascending: true });
}
