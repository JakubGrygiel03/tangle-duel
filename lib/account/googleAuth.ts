/**
 * Logowanie kontem Google (GIS) — pod przyszłą wersję Play / synchronizację.
 * Wymaga NEXT_PUBLIC_GOOGLE_CLIENT_ID (OAuth Web Client).
 */

export type GoogleProfile = {
  accountId: string;
  accountName: string;
  accountEmail: string;
};

type CredentialResponse = {
  credential?: string;
};

type JwtPayload = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            },
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const SCRIPT_ID = "tangle-google-gis";

export function googleClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return id && id.length > 0 ? id : null;
}

export function googleAuthConfigured(): boolean {
  return Boolean(googleClientId());
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function loadGisScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no-window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("gis-load")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gis-load"));
    document.head.appendChild(script);
  });
}

export async function signInWithGoogle(): Promise<GoogleProfile> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("missing-client-id");
  }
  await loadGisScript();
  if (!window.google?.accounts?.id) {
    throw new Error("gis-unavailable");
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (profile: GoogleProfile) => {
      if (settled) return;
      settled = true;
      resolve(profile);
    };
    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      reject(new Error(reason));
    };

    window.google!.accounts.id.initialize({
      client_id: clientId,
      cancel_on_tap_outside: true,
      callback: (response) => {
        const token = response.credential;
        if (!token) {
          fail("no-credential");
          return;
        }
        const payload = decodeJwtPayload(token);
        if (!payload?.sub) {
          fail("bad-token");
          return;
        }
        finish({
          accountId: payload.sub,
          accountName: payload.name ?? "",
          accountEmail: payload.email ?? "",
        });
      },
    });

    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        fail("prompt-suppressed");
      }
    });

    window.setTimeout(() => {
      if (!settled) fail("timeout");
    }, 60_000);
  });
}

export function signOutGoogle(): void {
  try {
    window.google?.accounts.id.disableAutoSelect();
  } catch {
    // Ignoruj — wylogowanie lokalne i tak następuje w save.
  }
}
