import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

type Role = Database["public"]["Enums"]["app_role"];

export async function listProfilesWithRoles() {
  const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, position_title, is_active").order("full_name"),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (profileError) throw profileError;
  if (roleError) throw roleError;
  const roleMap = new Map<string, Role[]>();
  for (const row of roles ?? []) roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role]);
  return (profiles ?? []).map((profile) => ({ ...profile, roles: roleMap.get(profile.id) ?? [] }));
}

export async function listAllPermissions() {
  const { data, error } = await supabase.from("permissions").select("code, description").order("code");
  if (error) throw error;
  return data ?? [];
}

export async function assignRole(userId: string, role: Role) {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}

export async function removeRole(userId: string, role: Role) {
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
  if (error) throw error;
}

export async function listAuditLogs(limit = 100) {
  const { data, error } = await supabase.from("audit_logs").select("id, actor_id, action, entity_type, entity_id, old_data, new_data, created_at").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}
