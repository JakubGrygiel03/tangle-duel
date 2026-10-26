import {
  constellationBonus,
  CRYSTAL_SHAPES,
  crystalShapeById,
  crystalsForLevel,
  isTrailId,
  PERFECT_MOVE_BONUS,
  SOUND_PACKS,
  soundPackById,
  TRAIL_STYLES,
  type CrystalShapeId,
  type SoundPackId,
  type TrailId,
} from "@/lib/engine/economy";
import {
  CONSTELLATIONS,
  type ConstellationId,
  constellationForLevel,
} from "@/lib/engine/constellations";
import {
  CAMPAIGN_LEVELS,
  MASTER_MAX_DIFFICULTY,
  MASTER_START_DIFFICULTY,
} from "@/lib/engine/graph";
import { computeUnlockedThemes, getTheme, THEMES, type ThemeId } from "@/lib/engine/themes";
import { isLocaleId, type LocalePreference } from "@/lib/i18n";

export type GameSave = {
  muted: boolean;
  haptics: boolean;
  /** Preferencja języka: auto = język systemu (fallback EN). */
  locale: LocalePreference;
  tutorialSeen: boolean;
  /** Pierwsze wyjaśnienie mechaniki konstelacji (poziom 5). */
  constellationIntroSeen: boolean;
  /** Bieżący poziom (kampania 1–180 albo nieskończone 181+). */
  level: number;
  /** Zaliczone poziomy kampanii. */
  clearedCampaign: number[];
  /** Najwyższy zaliczony poziom w nieskończoności (0 = brak). */
  endlessBest: number;
  themeId: ThemeId;
  /** Miękka waluta sklepu. */
  crystals: number;
  /** Motywy kupione za kryształy (wcześniej niż z postępu). */
  purchasedThemes: ThemeId[];
  /** Ostatnia (symulowana) reklama — cooldown. */
  lastAdAt: number;
  /** Dzień (YYYY-MM-DD), za który odebrano nagrodę Daily. */
  dailyClaimedOn: string;
  /** Seria kolejnych dni z zaliczonym Daily. */
  dailyStreak: number;
  /** Odkryte konstelacje (album). */
  constellations: ConstellationId[];
  /** Tryb Mistrz: bieżąca trudność do wznowienia. */
  masterLevel: number;
  /** Tryb Mistrz: najwyższa zaliczona trudność. */
  masterBest: number;
  /** Tryb Echo: numer układu do wznowienia. */
  echoRound: number;
  /** Tryb Echo: najlepsza seria układów. */
  echoBest: number;
  /** Błyskawica: najlepszy wynik (układów w biegu). */
  rushBest: number;
  /** Błyskawica: łączna liczba clearów (misje). */
  rushClearsTotal: number;
  /** Odebrane misje (id z QUESTS). */
  questClaims: string[];
  /** Ile razy otwarto / wystartowano pojedynek (misje). */
  duelStarted: number;
  /** Aktywny pakiet brzmienia. */
  soundPack: SoundPackId;
  /** Kupione pakiety (oprócz harfy). */
  purchasedSounds: SoundPackId[];
  /** Aktywny styl śladu (`null` = wyłączony). */
  activeTrail: TrailId | null;
  /** Kupione style śladu. */
  purchasedTrails: TrailId[];
  /** @deprecated Migracja ze starego zapisu — nie używać w UI. */
  trailOwned?: boolean;
  /** @deprecated Migracja ze starego zapisu — nie używać w UI. */
  trailEnabled?: boolean;
  /** Kształt węzłów na planszy. */
  crystalShape: CrystalShapeId;
  purchasedShapes: CrystalShapeId[];
  /** Jednorazowy zakup: bez reklam + pełny katalog sklepu. */
  premiumUnlocked: boolean;
  /** Przypomnienie o Daily (powiadomienie). */
  dailyReminder: boolean;
  /** Czy już pytano o zgodę na powiadomienia. */
  dailyReminderAsked: boolean;
  /** Konto Google (sub) — opcjonalne. */
  accountId: string;
  accountName: string;
  accountEmail: string;
};

const KEY = "tangle-duel-save";

function sanitizeLocale(value: unknown): LocalePreference {
  if (value === "auto") return "auto";
  if (typeof value === "string" && isLocaleId(value)) return value;
  return "auto";
}

function sanitizeNonNegInt(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function sanitizeMasterLevel(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return MASTER_START_DIFFICULTY;
  return Math.max(
    MASTER_START_DIFFICULTY,
    Math.min(MASTER_MAX_DIFFICULTY, Math.floor(value)),
  );
}

function sanitizeEchoRound(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(9999, Math.floor(value)));
}

export const defaultSave = (): GameSave => ({
  muted: false,
  haptics: true,
  locale: "auto",
  tutorialSeen: false,
  constellationIntroSeen: false,
  level: 1,
  clearedCampaign: [],
  endlessBest: 0,
  themeId: "dusk",
  crystals: 0,
  purchasedThemes: [],
  lastAdAt: 0,
  dailyClaimedOn: "",
  dailyStreak: 0,
  constellations: [],
  masterLevel: MASTER_START_DIFFICULTY,
  masterBest: 0,
  echoRound: 1,
  echoBest: 0,
  rushBest: 0,
  rushClearsTotal: 0,
  questClaims: [],
  duelStarted: 0,
  soundPack: "harp",
  purchasedSounds: [],
  activeTrail: null,
  purchasedTrails: [],
  crystalShape: "diamond",
  purchasedShapes: [],
  premiumUnlocked: false,
  dailyReminder: false,
  dailyReminderAsked: false,
  accountId: "",
  accountName: "",
  accountEmail: "",
});

/** Odblokuj cały katalog sklepu i wyłącz reklamy (zakup premium). */
export function withPremiumUnlock(current: GameSave): GameSave {
  const purchasedThemes = [...new Set([...current.purchasedThemes, ...THEMES.map((item) => item.id)])];
  const purchasedShapes = [
    ...new Set([...current.purchasedShapes, ...CRYSTAL_SHAPES.map((item) => item.id)]),
  ];
  const purchasedSounds = [
    ...new Set([...current.purchasedSounds, ...SOUND_PACKS.map((item) => item.id)]),
  ];
  const purchasedTrails = [
    ...new Set([...current.purchasedTrails, ...TRAIL_STYLES.map((item) => item.id)]),
  ];
  return {
    ...current,
    premiumUnlocked: true,
    purchasedThemes,
    purchasedShapes,
    purchasedSounds,
    purchasedTrails,
    activeTrail: current.activeTrail ?? "dust",
  };
}

function sanitizeCampaign(levels: unknown): number[] {
  if (!Array.isArray(levels)) return [];
  const unique = new Set<number>();
  for (const level of levels) {
    if (Number.isInteger(level) && level >= 1 && level <= CAMPAIGN_LEVELS) unique.add(level);
  }
  return [...unique].sort((a, b) => a - b);
}

function sanitizePurchased(ids: unknown): ThemeId[] {
  if (!Array.isArray(ids)) return [];
  const unique = new Set<ThemeId>();
  for (const id of ids) {
    if (typeof id === "string" && getTheme(id).id === id) unique.add(id as ThemeId);
  }
  return [...unique];
}

function sanitizeConstellations(ids: unknown): ConstellationId[] {
  if (!Array.isArray(ids)) return [];
  const known = new Set(CONSTELLATIONS.map((item) => item.id));
  const unique = new Set<ConstellationId>();
  for (const id of ids) {
    if (typeof id === "string" && known.has(id as ConstellationId)) {
      unique.add(id as ConstellationId);
    }
  }
  return [...unique];
}

/**
 * Album wyłącznie z realnie zaliczonych poziomów-figur.
 * Nie przyznaje za sam numer `level` / endless — to wcześniej odblokowywało
 * Diament/Łódź/Kwiat zanim gracz doszedł do poz. 6.
 */
export function mergeAlbumFromCleared(
  clearedCampaign: readonly number[],
  _owned: readonly ConstellationId[] = [],
  _progressLevel = 0,
  _endlessBest = 0,
): ConstellationId[] {
  const earned = new Set<ConstellationId>();
  for (const figure of CONSTELLATIONS) {
    if (clearedCampaign.includes(figure.level)) earned.add(figure.id);
  }
  return CONSTELLATIONS.map((item) => item.id).filter((id) => earned.has(id));
}

function sanitizeQuestClaims(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const unique = new Set<string>();
  for (const id of ids) {
    if (typeof id === "string" && id.length > 0 && id.length <= 48) unique.add(id);
  }
  return [...unique];
}

function sanitizeSounds(ids: unknown): SoundPackId[] {
  if (!Array.isArray(ids)) return [];
  const unique = new Set<SoundPackId>();
  for (const id of ids) {
    if (typeof id === "string" && soundPackById(id).id === id && id !== "harp") {
      unique.add(id as SoundPackId);
    }
  }
  return [...unique];
}

function sanitizeShapes(ids: unknown): CrystalShapeId[] {
  if (!Array.isArray(ids)) return [];
  const unique = new Set<CrystalShapeId>();
  for (const id of ids) {
    if (typeof id === "string" && crystalShapeById(id).id === id && id !== "diamond") {
      unique.add(id as CrystalShapeId);
    }
  }
  return [...unique];
}

function sanitizeTrails(ids: unknown): TrailId[] {
  if (!Array.isArray(ids)) return [];
  const unique = new Set<TrailId>();
  for (const id of ids) {
    if (typeof id === "string" && isTrailId(id)) unique.add(id);
  }
  return [...unique];
}

function resolveActiveTrail(
  raw: unknown,
  purchased: readonly TrailId[],
  legacyOwned: boolean,
  legacyEnabled: boolean,
): TrailId | null {
  if (raw === null || raw === "off" || raw === "none") return null;
  if (typeof raw === "string" && isTrailId(raw) && purchased.includes(raw)) return raw;
  if (legacyOwned && legacyEnabled && purchased.includes("dust")) return "dust";
  if (legacyOwned && legacyEnabled) return purchased[0] ?? null;
  return null;
}

function sanitizeLevel(value: unknown, clearedCampaign: number[], endlessBest: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    if (endlessBest > 0) return Math.max(CAMPAIGN_LEVELS + 1, endlessBest);
    const peak = clearedCampaign.length > 0 ? Math.max(...clearedCampaign) : 0;
    return Math.min(CAMPAIGN_LEVELS, Math.max(1, peak + 1));
  }
  return Math.max(1, Math.floor(value));
}

export function loadSave(): GameSave {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<GameSave> & { cleared?: number[] };

    const fromLegacy = Array.isArray(parsed.cleared)
      ? parsed.cleared.filter((level) => Number.isInteger(level) && level >= 1 && level <= CAMPAIGN_LEVELS)
      : [];
    const clearedCampaign = sanitizeCampaign(parsed.clearedCampaign ?? fromLegacy);
    const endlessBest =
      typeof parsed.endlessBest === "number" && Number.isFinite(parsed.endlessBest)
        ? Math.max(0, Math.floor(parsed.endlessBest))
        : 0;
    const purchasedThemes = sanitizePurchased(parsed.purchasedThemes);
    const progressLevel = sanitizeLevel(parsed.level, clearedCampaign, endlessBest);
    const constellations = mergeAlbumFromCleared(
      clearedCampaign,
      sanitizeConstellations(parsed.constellations),
      progressLevel,
      endlessBest,
    );
    const purchasedSounds = sanitizeSounds(parsed.purchasedSounds);
    const purchasedShapes = sanitizeShapes(parsed.purchasedShapes);
    const unlocked = computeUnlockedThemes(clearedCampaign, endlessBest, purchasedThemes);
    const themeId = getTheme(
      typeof parsed.themeId === "string" && unlocked.includes(parsed.themeId as ThemeId)
        ? parsed.themeId
        : "dusk",
    ).id;
    const crystals =
      typeof parsed.crystals === "number" && Number.isFinite(parsed.crystals)
        ? Math.max(0, Math.floor(parsed.crystals))
        : 0;
    const lastAdAt =
      typeof parsed.lastAdAt === "number" && Number.isFinite(parsed.lastAdAt)
        ? Math.max(0, parsed.lastAdAt)
        : 0;
    const dailyClaimedOn =
      typeof parsed.dailyClaimedOn === "string" ? parsed.dailyClaimedOn.slice(0, 10) : "";
    const dailyStreak =
      typeof parsed.dailyStreak === "number" && Number.isFinite(parsed.dailyStreak)
        ? Math.max(0, Math.floor(parsed.dailyStreak))
        : 0;
    const soundPack = soundPackById(
      typeof parsed.soundPack === "string" ? parsed.soundPack : "harp",
    ).id;
    const ownedSound =
      soundPack === "harp" || purchasedSounds.includes(soundPack) ? soundPack : "harp";
    const legacyTrailOwned = parsed.trailOwned === true;
    const legacyTrailEnabled = legacyTrailOwned && parsed.trailEnabled !== false;
    const purchasedTrails = sanitizeTrails(parsed.purchasedTrails);
    if (legacyTrailOwned && !purchasedTrails.includes("dust")) {
      purchasedTrails.push("dust");
    }
    const activeTrail = resolveActiveTrail(
      parsed.activeTrail,
      purchasedTrails,
      legacyTrailOwned,
      legacyTrailEnabled,
    );
    const crystalShape = crystalShapeById(
      typeof parsed.crystalShape === "string" ? parsed.crystalShape : "diamond",
    ).id;
    const ownedShape =
      crystalShape === "diamond" || purchasedShapes.includes(crystalShape)
        ? crystalShape
        : "diamond";

    const base: GameSave = {
      muted: parsed.muted === true,
      haptics: parsed.haptics !== false,
      locale: sanitizeLocale(parsed.locale),
      tutorialSeen: parsed.tutorialSeen === true,
      constellationIntroSeen: parsed.constellationIntroSeen === true,
      level: progressLevel,
      clearedCampaign,
      endlessBest,
      themeId,
      crystals,
      purchasedThemes,
      lastAdAt,
      dailyClaimedOn,
      dailyStreak,
      constellations,
      masterLevel: sanitizeMasterLevel(parsed.masterLevel),
      masterBest: sanitizeNonNegInt(parsed.masterBest, MASTER_MAX_DIFFICULTY),
      echoRound: sanitizeEchoRound(parsed.echoRound),
      echoBest: sanitizeNonNegInt(parsed.echoBest, 9999),
      rushBest: sanitizeNonNegInt(parsed.rushBest, 9999),
      rushClearsTotal: sanitizeNonNegInt(parsed.rushClearsTotal, 999_999),
      questClaims: sanitizeQuestClaims(parsed.questClaims),
      duelStarted: sanitizeNonNegInt(parsed.duelStarted, 9999),
      soundPack: ownedSound,
      purchasedSounds,
      activeTrail,
      purchasedTrails,
      crystalShape: ownedShape,
      purchasedShapes,
      premiumUnlocked: parsed.premiumUnlocked === true,
      dailyReminder: parsed.dailyReminder === true,
      dailyReminderAsked: parsed.dailyReminderAsked === true,
      accountId: typeof parsed.accountId === "string" ? parsed.accountId.slice(0, 128) : "",
      accountName: typeof parsed.accountName === "string" ? parsed.accountName.slice(0, 80) : "",
      accountEmail: typeof parsed.accountEmail === "string" ? parsed.accountEmail.slice(0, 120) : "",
    };
    return base.premiumUnlocked ? withPremiumUnlock(base) : base;
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
if (typeof window !== "undefined") {
  memory = loadSave();
}

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

let persistTimer: number | null = null;

/** Zapis na dysk poza ścieżką kliknięcia — UI reaguje od razu. */
function schedulePersist(): void {
  if (typeof window === "undefined") return;
  if (persistTimer !== null) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    writeSave(memory);
  }, 0);
}

export function updateSave(recipe: (current: GameSave) => GameSave): void {
  memory = recipe(memory);
  emit();
  schedulePersist();
}

/**
 * Reset postępu kampanii / trybów / albumu.
 * Zakup premium, konto Google i ustawienia przypomnienia zostają.
 */
export function resetProgress(
  keep: Pick<GameSave, "muted" | "haptics" | "locale"> & { tutorialSeen?: boolean } = {
    muted: false,
    haptics: true,
    locale: "auto",
  },
): GameSave {
  const previous = memory;
  let next: GameSave = {
    ...defaultSave(),
    muted: keep.muted,
    haptics: keep.haptics,
    locale: keep.locale ?? "auto",
    tutorialSeen: keep.tutorialSeen ?? true,
    // Entitlementy i konto — nie kasujemy przy resecie postępu.
    premiumUnlocked: previous.premiumUnlocked,
    dailyReminder: previous.dailyReminder,
    dailyReminderAsked: previous.dailyReminderAsked,
    accountId: previous.accountId,
    accountName: previous.accountName,
    accountEmail: previous.accountEmail,
  };
  if (next.premiumUnlocked) {
    next = withPremiumUnlock(next);
  }
  memory = next;
  writeSave(next);
  emit();
  return next;
}

/** Poziom dostępny w kampanii: 1 albo bezpośrednio po najwyższym zaliczonym. */
export function isLevelPlayable(level: number, clearedCampaign: readonly number[]): boolean {
  if (level < 1 || level > CAMPAIGN_LEVELS) return false;
  if (level === 1) return true;
  if (clearedCampaign.includes(level)) return true;
  const peak = clearedCampaign.length > 0 ? Math.max(...clearedCampaign) : 0;
  return level === peak + 1;
}

export function subscribeSave(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type ClearReward = {
  crystals: number;
  constellation: ConstellationId | null;
  alreadyCleared: boolean;
};

/** Pierwsze zaliczenie poziomu: postęp + kryształy + album. */
export function recordClearedLevel(
  current: GameSave,
  level: number,
  opts?: { perfect?: boolean; constellationId?: ConstellationId },
): { save: GameSave; reward: ClearReward } {
  const perfectBonus = opts?.perfect ? PERFECT_MOVE_BONUS : 0;
  const figure =
    (opts?.constellationId
      ? (CONSTELLATIONS.find((item) => item.id === opts.constellationId) ?? null)
      : null) ?? constellationForLevel(level);

  if (level >= 1 && level <= CAMPAIGN_LEVELS) {
    const already = current.clearedCampaign.includes(level);
    const albumWasMissing = Boolean(figure && !current.constellations.includes(figure.id));
    const nextCleared = already
      ? current.clearedCampaign
      : [...current.clearedCampaign, level].sort((a, b) => a - b);
    const constellations = mergeAlbumFromCleared(
      nextCleared,
      current.constellations,
      Math.max(current.level, level + 1),
      current.endlessBest,
    );
    const unlockedNow =
      albumWasMissing && figure && constellations.includes(figure.id) ? figure.id : null;

    if (already) {
      if (!albumWasMissing) {
        return {
          save: current,
          reward: { crystals: 0, constellation: null, alreadyCleared: true },
        };
      }
      return {
        save: { ...current, constellations },
        reward: { crystals: 0, constellation: unlockedNow, alreadyCleared: true },
      };
    }

    const base = crystalsForLevel(level);
    const bonus = constellationBonus(level);
    const crystals = base + bonus + perfectBonus;
    return {
      save: {
        ...current,
        clearedCampaign: nextCleared,
        crystals: current.crystals + crystals,
        constellations,
      },
      reward: {
        crystals,
        constellation: unlockedNow,
        alreadyCleared: false,
      },
    };
  }

  if (level > CAMPAIGN_LEVELS) {
    if (level <= current.endlessBest) {
      return {
        save: current,
        reward: { crystals: 0, constellation: null, alreadyCleared: true },
      };
    }
    const base = crystalsForLevel(level);
    const crystals = base + perfectBonus;
    return {
      save: {
        ...current,
        endlessBest: level,
        crystals: current.crystals + crystals,
      },
      reward: { crystals, constellation: null, alreadyCleared: false },
    };
  }

  return {
    save: current,
    reward: { crystals: 0, constellation: null, alreadyCleared: true },
  };
}
