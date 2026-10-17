export type GameSave = {
  muted: boolean;
  haptics: boolean;
  tutorialSeen: boolean;
  level: number;
  cleared: number[];
};

const KEY = "tangle-duel-save";

export const defaultSave = (): GameSave => ({
  muted: false,
  haptics: true,
  tutorialSeen: false,
  level: 1,
  cleared: [],
});

export function loadSave(): GameSave {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    const cleared = Array.isArray(parsed.cleared)
      ? parsed.cleared.filter((level) => Number.isInteger(level) && level >= 1 && level <= 15)
      : [];
    return {
      muted: parsed.muted === true,
      haptics: parsed.haptics !== false,
      tutorialSeen: parsed.tutorialSeen === true,
      level: typeof parsed.level === "number" ? Math.min(15, Math.max(1, Math.floor(parsed.level))) : 1,
      cleared,
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(save: GameSave): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Prywatny tryb przeglądarki może odmówić zapisu. Gra działa dalej.
  }
}

let memory: GameSave = defaultSave();
if (typeof window !== "undefined") memory = loadSave();

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

const serverSave = defaultSave();

export function readSave(): GameSave {
  return memory;
}

export function readServerSave(): GameSave {
  return serverSave;
}

export function updateSave(recipe: (current: GameSave) => GameSave): void {
  memory = recipe(memory);
  writeSave(memory);
  emit();
}

export function subscribeSave(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
