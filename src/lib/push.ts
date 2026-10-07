import { supabase } from "./supabase";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function registerPushServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { supported: false, subscribed: false };
  }
  const registration = await navigator.serviceWorker.register("/sw.js");
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!publicKey) return { supported: true, subscribed: false, reason: "missing_public_key" as const };

  const permission = Notification.permission === "default"
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== "granted") return { supported: true, subscribed: false, reason: "permission_denied" as const };

  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supported: true, subscribed: false, reason: "not_authenticated" as const };

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
    user_agent: navigator.userAgent,
  }, { onConflict: "endpoint" });
  if (error) throw error;

  return { supported: true, subscribed: true };
}
