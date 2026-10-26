import { CAMPAIGN_LEVELS } from "./graph";

export type ThemeId =
  | "dusk"
  | "nebula"
  | "glacier"
  | "ember"
  | "garden"
  | "abyss"
  | "gold"
  | "aurora";

export type ThemeBloom = {
  a: string;
  b: string;
  c: string;
};

export type VisualTheme = {
  id: ThemeId;
  name: string;
  /** Poziom kampanii, po którego zaliczeniu motyw się otwiera. 0 = od startu. */
  unlockAt: number;
  /** Odblokowanie z nieskończoności (najwyższy zaliczony). 0 = nie dotyczy. */
  unlockEndless: number;
  ink: string;
  ice: string;
  warm: string;
  spark: string;
  sky: ThemeBloom;
  tide: ThemeBloom;
  ember: ThemeBloom;
  tangled: string;
  tangledGlow: string;
  tangledCore: string;
  free: string;
  freeGlow: string;
  freeCore: string;
  crystalCool: readonly [string, string, string];
  crystalWarm: readonly [string, string, string];
  moteCool: string;
  moteWarm: string;
  arenaFill: string;
  arenaStroke: string;
  bloomRing: string;
  bloomFlash: string;
};

export const THEMES: readonly VisualTheme[] = [
  {
    id: "dusk",
    name: "Zmierzch",
    unlockAt: 0,
    unlockEndless: 0,
    ink: "#09090b",
    ice: "#e0f2fe",
    warm: "#fdba74",
    spark: "#ef4444",
    sky: { a: "rgba(67, 56, 140, 0.55)", b: "rgba(30, 27, 75, 0.32)", c: "rgba(9, 9, 11, 0)" },
    tide: { a: "rgba(12, 74, 110, 0.38)", b: "rgba(9, 9, 11, 0)", c: "rgba(9, 9, 11, 0)" },
    ember: { a: "rgba(124, 45, 18, 0.22)", b: "rgba(9, 9, 11, 0)", c: "rgba(9, 9, 11, 0)" },
    tangled: "#f97316",
    tangledGlow: "rgba(239, 68, 68, 0.9)",
    tangledCore: "rgba(255, 237, 213, 0.92)",
    free: "#e0f2fe",
    freeGlow: "rgba(224, 242, 254, 0.95)",
    freeCore: "rgba(255, 255, 255, 0.95)",
    crystalCool: ["#ffffff", "#e0f2fe", "#7dd3fc"],
    crystalWarm: ["#fff7ed", "#fdba74", "#c2410c"],
    moteCool: "224, 242, 254",
    moteWarm: "249, 115, 22",
    arenaFill: "rgba(224, 242, 254, 0.03)",
    arenaStroke: "rgba(224, 242, 254, 0.28)",
    bloomRing: "rgba(224, 242, 254, 0.8)",
    bloomFlash: "224, 242, 254",
  },
  {
    id: "nebula",
    name: "Mgławica",
    unlockAt: 36,
    unlockEndless: 0,
    ink: "#07060f",
    ice: "#f5e1ff",
    warm: "#e879f9",
    spark: "#c084fc",
    sky: { a: "rgba(126, 34, 206, 0.5)", b: "rgba(76, 29, 149, 0.34)", c: "rgba(7, 6, 15, 0)" },
    tide: { a: "rgba(91, 33, 182, 0.36)", b: "rgba(7, 6, 15, 0)", c: "rgba(7, 6, 15, 0)" },
    ember: { a: "rgba(190, 24, 93, 0.24)", b: "rgba(7, 6, 15, 0)", c: "rgba(7, 6, 15, 0)" },
    tangled: "#e879f9",
    tangledGlow: "rgba(192, 132, 252, 0.9)",
    tangledCore: "rgba(250, 232, 255, 0.92)",
    free: "#f5e1ff",
    freeGlow: "rgba(245, 225, 255, 0.95)",
    freeCore: "rgba(255, 255, 255, 0.95)",
    crystalCool: ["#ffffff", "#f5e1ff", "#d8b4fe"],
    crystalWarm: ["#fdf4ff", "#f0abfc", "#a21caf"],
    moteCool: "245, 225, 255",
    moteWarm: "232, 121, 249",
    arenaFill: "rgba(245, 225, 255, 0.04)",
    arenaStroke: "rgba(245, 225, 255, 0.28)",
    bloomRing: "rgba(245, 225, 255, 0.8)",
    bloomFlash: "245, 225, 255",
  },
  {
    id: "glacier",
    name: "Lodowiec",
    unlockAt: 72,
    unlockEndless: 0,
    ink: "#061018",
    ice: "#ecfeff",
    warm: "#22d3ee",
    spark: "#38bdf8",
    sky: { a: "rgba(8, 145, 178, 0.48)", b: "rgba(14, 116, 144, 0.28)", c: "rgba(6, 16, 24, 0)" },
    tide: { a: "rgba(14, 165, 233, 0.34)", b: "rgba(6, 16, 24, 0)", c: "rgba(6, 16, 24, 0)" },
    ember: { a: "rgba(56, 189, 248, 0.2)", b: "rgba(6, 16, 24, 0)", c: "rgba(6, 16, 24, 0)" },
    tangled: "#22d3ee",
    tangledGlow: "rgba(56, 189, 248, 0.9)",
    tangledCore: "rgba(207, 250, 254, 0.95)",
    free: "#ecfeff",
    freeGlow: "rgba(236, 254, 255, 0.95)",
    freeCore: "rgba(255, 255, 255, 0.95)",
    crystalCool: ["#ffffff", "#ecfeff", "#67e8f9"],
    crystalWarm: ["#ecfeff", "#67e8f9", "#0e7490"],
    moteCool: "236, 254, 255",
    moteWarm: "34, 211, 238",
    arenaFill: "rgba(236, 254, 255, 0.04)",
    arenaStroke: "rgba(236, 254, 255, 0.3)",
    bloomRing: "rgba(236, 254, 255, 0.8)",
    bloomFlash: "236, 254, 255",
  },
  {
    id: "ember",
    name: "Ember",
    unlockAt: 108,
    unlockEndless: 0,
    ink: "#120808",
    ice: "#fff7ed",
    warm: "#fb923c",
    spark: "#f43f5e",
    sky: { a: "rgba(154, 52, 18, 0.5)", b: "rgba(69, 26, 3, 0.34)", c: "rgba(18, 8, 8, 0)" },
    tide: { a: "rgba(127, 29, 29, 0.32)", b: "rgba(18, 8, 8, 0)", c: "rgba(18, 8, 8, 0)" },
    ember: { a: "rgba(234, 88, 12, 0.28)", b: "rgba(18, 8, 8, 0)", c: "rgba(18, 8, 8, 0)" },
    tangled: "#fb923c",
    tangledGlow: "rgba(244, 63, 94, 0.9)",
    tangledCore: "rgba(255, 237, 213, 0.95)",
    free: "#fff7ed",
    freeGlow: "rgba(255, 247, 237, 0.95)",
    freeCore: "rgba(255, 255, 255, 0.95)",
    crystalCool: ["#ffffff", "#ffedd5", "#fdba74"],
    crystalWarm: ["#fff7ed", "#fb923c", "#9a3412"],
    moteCool: "255, 247, 237",
    moteWarm: "251, 146, 60",
    arenaFill: "rgba(255, 247, 237, 0.04)",
    arenaStroke: "rgba(255, 247, 237, 0.28)",
    bloomRing: "rgba(255, 247, 237, 0.8)",
    bloomFlash: "255, 247, 237",
  },
  {
    id: "garden",
    name: "Ogród",
    unlockAt: 144,
    unlockEndless: 0,
    ink: "#07140c",
    ice: "#ecfdf5",
    warm: "#34d399",
    spark: "#a3e635",
    sky: { a: "rgba(6, 95, 70, 0.48)", b: "rgba(6, 78, 59, 0.3)", c: "rgba(7, 20, 12, 0)" },
    tide: { a: "rgba(21, 128, 61, 0.3)", b: "rgba(7, 20, 12, 0)", c: "rgba(7, 20, 12, 0)" },
    ember: { a: "rgba(132, 204, 22, 0.22)", b: "rgba(7, 20, 12, 0)", c: "rgba(7, 20, 12, 0)" },
    tangled: "#34d399",
    tangledGlow: "rgba(163, 230, 53, 0.85)",
    tangledCore: "rgba(209, 250, 229, 0.95)",
    free: "#ecfdf5",
    freeGlow: "rgba(236, 253, 245, 0.95)",
    freeCore: "rgba(255, 255, 255, 0.95)",
    crystalCool: ["#ffffff", "#ecfdf5", "#6ee7b7"],
    crystalWarm: ["#ecfdf5", "#34d399", "#047857"],
    moteCool: "236, 253, 245",
    moteWarm: "52, 211, 153",
    arenaFill: "rgba(236, 253, 245, 0.04)",
    arenaStroke: "rgba(236, 253, 245, 0.28)",
    bloomRing: "rgba(236, 253, 245, 0.8)",
    bloomFlash: "236, 253, 245",
  },
  {
    id: "abyss",
    name: "Głębia",
    unlockAt: 0,
    unlockEndless: 45,
    ink: "#04060f",
    ice: "#e0e7ff",
    warm: "#818cf8",
    spark: "#6366f1",
    sky: { a: "rgba(30, 58, 138, 0.5)", b: "rgba(15, 23, 42, 0.4)", c: "rgba(4, 6, 15, 0)" },
    tide: { a: "rgba(29, 78, 216, 0.28)", b: "rgba(4, 6, 15, 0)", c: "rgba(4, 6, 15, 0)" },
    ember: { a: "rgba(67, 56, 202, 0.24)", b: "rgba(4, 6, 15, 0)", c: "rgba(4, 6, 15, 0)" },
    tangled: "#818cf8",
    tangledGlow: "rgba(99, 102, 241, 0.9)",
    tangledCore: "rgba(224, 231, 255, 0.95)",
    free: "#e0e7ff",
    freeGlow: "rgba(224, 231, 255, 0.95)",
    freeCore: "rgba(255, 255, 255, 0.95)",
    crystalCool: ["#ffffff", "#e0e7ff", "#a5b4fc"],
    crystalWarm: ["#eef2ff", "#818cf8", "#3730a3"],
    moteCool: "224, 231, 255",
    moteWarm: "129, 140, 248",
    arenaFill: "rgba(224, 231, 255, 0.04)",
    arenaStroke: "rgba(224, 231, 255, 0.28)",
    bloomRing: "rgba(224, 231, 255, 0.8)",
    bloomFlash: "224, 231, 255",
  },
  {
    id: "gold",
    name: "Złoto",
    unlockAt: 0,
    unlockEndless: 90,
    ink: "#100c04",
    ice: "#fffbeb",
    warm: "#fbbf24",
    spark: "#f59e0b",
    sky: { a: "rgba(161, 98, 7, 0.48)", b: "rgba(69, 26, 3, 0.32)", c: "rgba(16, 12, 4, 0)" },
    tide: { a: "rgba(180, 83, 9, 0.28)", b: "rgba(16, 12, 4, 0)", c: "rgba(16, 12, 4, 0)" },
    ember: { a: "rgba(234, 179, 8, 0.26)", b: "rgba(16, 12, 4, 0)", c: "rgba(16, 12, 4, 0)" },
    tangled: "#fbbf24",
    tangledGlow: "rgba(245, 158, 11, 0.9)",
    tangledCore: "rgba(254, 243, 199, 0.95)",
    free: "#fffbeb",
    freeGlow: "rgba(255, 251, 235, 0.95)",
    freeCore: "rgba(255, 255, 255, 0.95)",
    crystalCool: ["#ffffff", "#fef3c7", "#fcd34d"],
    crystalWarm: ["#fffbeb", "#fbbf24", "#b45309"],
    moteCool: "255, 251, 235",
    moteWarm: "251, 191, 36",
    arenaFill: "rgba(255, 251, 235, 0.04)",
    arenaStroke: "rgba(255, 251, 235, 0.3)",
    bloomRing: "rgba(255, 251, 235, 0.8)",
    bloomFlash: "255, 251, 235",
  },
  {
    id: "aurora",
    name: "Zorza",
    unlockAt: 0,
    unlockEndless: 135,
    ink: "#050914",
    ice: "#f0fdfa",
    warm: "#2dd4bf",
    spark: "#a78bfa",
    sky: { a: "rgba(13, 148, 136, 0.42)", b: "rgba(76, 29, 149, 0.28)", c: "rgba(5, 9, 20, 0)" },
    tide: { a: "rgba(45, 212, 191, 0.28)", b: "rgba(5, 9, 20, 0)", c: "rgba(5, 9, 20, 0)" },
    ember: { a: "rgba(167, 139, 250, 0.26)", b: "rgba(5, 9, 20, 0)", c: "rgba(5, 9, 20, 0)" },
    tangled: "#2dd4bf",
    tangledGlow: "rgba(167, 139, 250, 0.9)",
    tangledCore: "rgba(204, 251, 241, 0.95)",
    free: "#f0fdfa",
    freeGlow: "rgba(240, 253, 250, 0.95)",
    freeCore: "rgba(255, 255, 255, 0.95)",
    crystalCool: ["#ffffff", "#f0fdfa", "#5eead4"],
    crystalWarm: ["#f5f3ff", "#a78bfa", "#0f766e"],
    moteCool: "240, 253, 250",
    moteWarm: "45, 212, 191",
    arenaFill: "rgba(240, 253, 250, 0.04)",
    arenaStroke: "rgba(240, 253, 250, 0.28)",
    bloomRing: "rgba(240, 253, 250, 0.8)",
    bloomFlash: "240, 253, 250",
  },
];

const byId = new Map(THEMES.map((theme) => [theme.id, theme]));

export function getTheme(id: string | null | undefined): VisualTheme {
  return byId.get(id as ThemeId) ?? THEMES[0]!;
}

/** Zmienne CSS dla UI — jeden wariant barw z aktywnego motywu. */
export function themeChromeVars(theme: VisualTheme): Record<string, string> {
  return {
    "--ui-ink": theme.ink,
    "--ui-ice": theme.ice,
    "--ui-warm": theme.warm,
    "--ui-spark": theme.spark,
    "--ui-play-a": theme.crystalCool[0],
    "--ui-play-b": theme.crystalCool[1],
    "--ui-play-c": theme.crystalCool[2],
    "--ui-glow": `rgba(${theme.moteCool}, 0.28)`,
    "--ui-glow-strong": `rgba(${theme.moteCool}, 0.42)`,
    "--ui-warm-soft": `${theme.warm}33`,
    "--ui-warm-mid": `${theme.warm}55`,
    "--ui-ice-soft": `${theme.ice}24`,
    "--ui-ice-mid": `${theme.ice}40`,
    "--ui-ice-faint": `${theme.ice}73`,
  };
}

export function themeUnlockRequirement(theme: VisualTheme): string {
  if (theme.unlockAt <= 0 && theme.unlockEndless <= 0) return "Od startu";
  if (theme.unlockEndless > 0) return `Nieskończone ${theme.unlockEndless}`;
  return `Poziom ${theme.unlockAt}`;
}

export function isThemeUnlocked(
  theme: VisualTheme,
  clearedCampaign: readonly number[],
  endlessBest: number,
  purchased: readonly ThemeId[] = [],
): boolean {
  if (purchased.includes(theme.id)) return true;
  if (theme.unlockAt <= 0 && theme.unlockEndless <= 0) return true;
  if (theme.unlockAt > 0 && clearedCampaign.includes(theme.unlockAt)) return true;
  if (theme.unlockEndless > 0 && endlessBest >= theme.unlockEndless) return true;
  return false;
}

export function computeUnlockedThemes(
  clearedCampaign: readonly number[],
  endlessBest: number,
  purchased: readonly ThemeId[] = [],
): ThemeId[] {
  return THEMES.filter((theme) =>
    isThemeUnlocked(theme, clearedCampaign, endlessBest, purchased),
  ).map((theme) => theme.id);
}

/** Motywy nowo otwarte po zaliczeniu danego poziomu. */
export function themesUnlockedByClear(
  level: number,
  clearedCampaign: readonly number[],
  endlessBest: number,
  purchased: readonly ThemeId[] = [],
): VisualTheme[] {
  const beforeCampaign = clearedCampaign.filter((item) => item !== level);
  const beforeEndless =
    level > CAMPAIGN_LEVELS ? Math.min(endlessBest, level - 1) : endlessBest;
  const before = new Set(computeUnlockedThemes(beforeCampaign, beforeEndless, purchased));
  const afterCampaign =
    level <= CAMPAIGN_LEVELS
      ? clearedCampaign.includes(level)
        ? clearedCampaign
        : [...clearedCampaign, level]
      : clearedCampaign;
  const afterEndless = level > CAMPAIGN_LEVELS ? Math.max(endlessBest, level) : endlessBest;
  return THEMES.filter(
    (theme) =>
      !before.has(theme.id) && isThemeUnlocked(theme, afterCampaign, afterEndless, purchased),
  );
}
