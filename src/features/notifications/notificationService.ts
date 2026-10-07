import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("user_id", userId).eq("is_read", false);
  if (error) throw error;
}
