self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || "ระบบสารบรรณอิเล็กทรอนิกส์";
  const options = {
    body: data.body || "มีรายการใหม่ในระบบสารบรรณ",
    data: { url: data.url || "/" },
    tag: data.tag || "wbns-eoffice",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const existing = list.find((client) => "focus" in client);
    return existing ? existing.focus() : clients.openWindow(url);
  }));
});
