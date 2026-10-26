/** Przypomnienie o Daily — Web Notifications + service worker. */

export const DAILY_REMINDER_HOUR = 10;
const REMINDER_TAG = "tangle-daily";

export type ReminderPermission = "granted" | "denied" | "default" | "unsupported";

export function notificationSupport(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function currentReminderPermission(): ReminderPermission {
  if (!notificationSupport()) return "unsupported";
  return Notification.permission as ReminderPermission;
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!notificationSupport()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result as ReminderPermission;
  } catch {
    return "denied";
  }
}

function msUntilNextReminder(hour = DAILY_REMINDER_HOUR): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= now.getTime() + 15_000) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

let armedTimer: number | null = null;

export function clearDailyReminderTimer(): void {
  if (armedTimer !== null) {
    window.clearTimeout(armedTimer);
    armedTimer = null;
  }
}

/**
 * Ustaw lokalny timer (działa, gdy karta/PWA żyje) i poproś SW o pokazanie notyfikacji.
 * Na Androidzie Chrome w trybie standalone to najczęściej dostępny mechanizm bez backendu.
 */
export function armDailyReminder(opts: {
  enabled: boolean;
  title: string;
  body: string;
  alreadyClaimedToday: boolean;
}): void {
  clearDailyReminderTimer();
  if (!opts.enabled || !notificationSupport()) return;
  if (Notification.permission !== "granted") return;
  if (opts.alreadyClaimedToday) {
    // Po odbiorze — przypomnij jutro o tej samej godzinie.
  }

  const delay = msUntilNextReminder();
  armedTimer = window.setTimeout(() => {
    void showDailyReminderNotification(opts.title, opts.body);
    armDailyReminder(opts);
  }, delay);
}

export async function showDailyReminderNotification(title: string, body: string): Promise<void> {
  if (!notificationSupport() || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker.ready;
    // `renotify` jest w specyfikacji, ale nie w typach DOM z lib.dom.d.ts.
    const options: NotificationOptions & { renotify?: boolean } = {
      body,
      tag: REMINDER_TAG,
      renotify: true,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/" },
    };
    await reg.showNotification(title, options);
  } catch {
    try {
      new Notification(title, { body, tag: REMINDER_TAG, icon: "/icons/icon-192.png" });
    } catch {
      // Brak uprawnień / przeglądarka blokuje.
    }
  }
}

/** Od razu pokaż próbne powiadomienie (po włączeniu w ustawieniach). */
export async function previewDailyReminder(title: string, body: string): Promise<void> {
  await showDailyReminderNotification(title, body);
}
