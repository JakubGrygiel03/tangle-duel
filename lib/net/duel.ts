export type DuelRole = "host" | "guest";

export type DuelWire =
  | { type: "hello"; role: DuelRole }
  | { type: "match"; level: number; seed: number }
  | { type: "start"; at: number }
  | { type: "cleared"; at: number }
  | { type: "result"; winner: "host" | "guest" | "draw"; hostAt: number; guestAt: number }
  | { type: "ping" };

export type DuelHandlers = {
  onOpen: () => void;
  onClose: (reason: string) => void;
  onMessage: (message: DuelWire) => void;
};

export type DuelSession = {
  role: DuelRole;
  code: string;
  send: (message: DuelWire) => void;
  destroy: () => void;
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomRoomCode(length = 5): string {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let index = 0; index < length; index++) {
    out += CODE_CHARS[bytes[index]! % CODE_CHARS.length];
  }
  return out;
}

export function peerIdFromCode(code: string): string {
  return `tangle-duel-${code.trim().toUpperCase()}`;
}

export function parseDuelMessage(raw: unknown): DuelWire | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as DuelWire;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Host publikuje peer id z kodu pokoju. Gość łączy się do tego id.
 * PeerJS ładujemy dynamicznie, żeby solo nie ciągnęło pakietu.
 */
export async function openDuelSession(
  role: DuelRole,
  code: string,
  handlers: DuelHandlers,
): Promise<DuelSession> {
  const { default: Peer } = await import("peerjs");
  const room = code.trim().toUpperCase();
  const peer =
    role === "host"
      ? new Peer(peerIdFromCode(room), { debug: 0 })
      : new Peer({ debug: 0 });

  let conn: { send: (data: string) => void; close: () => void; open: boolean } | null = null;
  let closed = false;

  const fail = (reason: string) => {
    if (closed) return;
    closed = true;
    handlers.onClose(reason);
    try {
      conn?.close();
    } catch {
      // Połączenie mogło już paść.
    }
    try {
      peer.destroy();
    } catch {
      // Peer mógł być już zniszczony.
    }
  };

  const attach = (connection: {
    open: boolean;
    send: (data: string) => void;
    close: () => void;
    on: (event: string, cb: (...args: never[]) => void) => void;
  }) => {
    conn = connection;
    connection.on("open", (() => {
      handlers.onOpen();
      connection.send(JSON.stringify({ type: "hello", role } satisfies DuelWire));
    }) as (...args: never[]) => void);
    connection.on("data", ((data: unknown) => {
      const message = parseDuelMessage(data);
      if (message) handlers.onMessage(message);
    }) as (...args: never[]) => void);
    connection.on("close", (() => fail("Połączenie przerwane.")) as (...args: never[]) => void);
    connection.on("error", (() => fail("Błąd połączenia.")) as (...args: never[]) => void);
  };

  peer.on("error", (error: Error) => {
    const message = error.message || "";
    if (message.includes("is taken") || message.includes("unavailable-id")) {
      fail("Ten kod jest już zajęty. Wylosuj inny.");
      return;
    }
    if (message.includes("Could not connect") || message.includes("peer-unavailable")) {
      fail("Nie znaleziono pokoju. Sprawdź kod.");
      return;
    }
    fail("Nie udało się połączyć.");
  });

  await new Promise<void>((resolve, reject) => {
    peer.on("open", () => resolve());
    peer.on("error", (error: Error) => reject(error));
  }).catch((error: Error) => {
    fail(error.message || "Nie udało się połączyć.");
    throw error;
  });

  if (closed) {
    throw new Error("Sesja zamknięta.");
  }

  if (role === "host") {
    peer.on("connection", (connection) => {
      if (conn) {
        connection.close();
        return;
      }
      attach(connection as never);
    });
  } else {
    const connection = peer.connect(peerIdFromCode(room), { reliable: true });
    attach(connection as never);
  }

  return {
    role,
    code: room,
    send: (message) => {
      if (!conn?.open) return;
      conn.send(JSON.stringify(message));
    },
    destroy: () => fail("Sesja zakończona."),
  };
}
