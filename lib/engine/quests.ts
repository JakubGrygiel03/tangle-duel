import type { MessageKey } from "@/lib/i18n/messages";

/** Deep-link z paska misji na ekran / tryb. */
export type QuestDeepLink = "play" | "rush" | "modes" | "daily" | "duel" | "levels";

export type QuestGoal =
  | { kind: "campaignClears"; count: number }
  | { kind: "campaignReach"; level: number }
  | { kind: "dailyClaim"; count: number }
  | { kind: "rushClearsTotal"; count: number }
  /** Rekord w jednym biegu Błyskawicy (rushBest). */
  | { kind: "rushBest"; count: number }
  | { kind: "constellation"; count: number }
  | { kind: "duelStarted"; count: number }
  | { kind: "masterBest"; count: number }
  | { kind: "echoBest"; count: number };

export type QuestDef = {
  id: string;
  titleKey: MessageKey;
  detailKey: MessageKey;
  reward: number;
  goal: QuestGoal;
  deepLink: QuestDeepLink;
};

/**
 * Długa ścieżka misji — aktywna = pierwsza nieodebrana.
 * Id q1–q8 zachowane (stare save'y z questClaims).
 * rushBest = rekord jednego biegu; rushClearsTotal = suma clearów.
 */
export const QUESTS: readonly QuestDef[] = [
  {
    id: "q1_campaign_3",
    titleKey: "quest_q1_title",
    detailKey: "quest_q1_detail",
    reward: 15,
    goal: { kind: "campaignClears", count: 3 },
    deepLink: "play",
  },
  {
    id: "q2_daily",
    titleKey: "quest_q2_title",
    detailKey: "quest_q2_detail",
    reward: 20,
    goal: { kind: "dailyClaim", count: 1 },
    deepLink: "daily",
  },
  {
    id: "q3_rush_5",
    titleKey: "quest_q3_title",
    detailKey: "quest_q3_detail",
    reward: 25,
    goal: { kind: "rushClearsTotal", count: 5 },
    deepLink: "rush",
  },
  {
    id: "q4_constellation",
    titleKey: "quest_q4_title",
    detailKey: "quest_q4_detail",
    reward: 40,
    goal: { kind: "constellation", count: 1 },
    deepLink: "levels",
  },
  {
    id: "q5_campaign_10",
    titleKey: "quest_q5_title",
    detailKey: "quest_q5_detail",
    reward: 30,
    goal: { kind: "campaignClears", count: 10 },
    deepLink: "play",
  },
  {
    id: "q6_duel",
    titleKey: "quest_q6_title",
    detailKey: "quest_q6_detail",
    reward: 20,
    /** Utwórz pokój (zaproszenie) albo zagraj kanapę na jednym telefonie. */
    goal: { kind: "duelStarted", count: 1 },
    deepLink: "duel",
  },
  {
    id: "q7_reach_20",
    titleKey: "quest_q7_title",
    detailKey: "quest_q7_detail",
    reward: 40,
    goal: { kind: "campaignReach", level: 20 },
    deepLink: "play",
  },
  {
    id: "q8_rush_15",
    titleKey: "quest_q8_title",
    detailKey: "quest_q8_detail",
    reward: 50,
    goal: { kind: "rushClearsTotal", count: 15 },
    deepLink: "rush",
  },
  {
    id: "q9_rush_best_5",
    titleKey: "quest_q9_title",
    detailKey: "quest_q9_detail",
    reward: 25,
    goal: { kind: "rushBest", count: 5 },
    deepLink: "rush",
  },
  {
    id: "q10_campaign_25",
    titleKey: "quest_q10_title",
    detailKey: "quest_q10_detail",
    reward: 35,
    goal: { kind: "campaignClears", count: 25 },
    deepLink: "play",
  },
  {
    id: "q11_rush_best_10",
    titleKey: "quest_q11_title",
    detailKey: "quest_q11_detail",
    reward: 40,
    goal: { kind: "rushBest", count: 10 },
    deepLink: "rush",
  },
  {
    id: "q12_constellation_3",
    titleKey: "quest_q12_title",
    detailKey: "quest_q12_detail",
    reward: 50,
    goal: { kind: "constellation", count: 3 },
    deepLink: "levels",
  },
  {
    id: "q13_master_5",
    titleKey: "quest_q13_title",
    detailKey: "quest_q13_detail",
    reward: 40,
    goal: { kind: "masterBest", count: 5 },
    deepLink: "modes",
  },
  {
    id: "q14_reach_36",
    titleKey: "quest_q14_title",
    detailKey: "quest_q14_detail",
    reward: 45,
    goal: { kind: "campaignReach", level: 36 },
    deepLink: "play",
  },
  {
    id: "q15_rush_best_15",
    titleKey: "quest_q15_title",
    detailKey: "quest_q15_detail",
    reward: 55,
    goal: { kind: "rushBest", count: 15 },
    deepLink: "rush",
  },
  {
    id: "q16_echo_5",
    titleKey: "quest_q16_title",
    detailKey: "quest_q16_detail",
    reward: 40,
    goal: { kind: "echoBest", count: 5 },
    deepLink: "modes",
  },
  {
    id: "q17_rush_40_total",
    titleKey: "quest_q17_title",
    detailKey: "quest_q17_detail",
    reward: 50,
    goal: { kind: "rushClearsTotal", count: 40 },
    deepLink: "rush",
  },
  {
    id: "q18_campaign_50",
    titleKey: "quest_q18_title",
    detailKey: "quest_q18_detail",
    reward: 50,
    goal: { kind: "campaignClears", count: 50 },
    deepLink: "play",
  },
  {
    id: "q19_constellation_6",
    titleKey: "quest_q19_title",
    detailKey: "quest_q19_detail",
    reward: 60,
    goal: { kind: "constellation", count: 6 },
    deepLink: "levels",
  },
  {
    id: "q20_rush_best_20",
    titleKey: "quest_q20_title",
    detailKey: "quest_q20_detail",
    reward: 70,
    goal: { kind: "rushBest", count: 20 },
    deepLink: "rush",
  },
  {
    id: "q21_reach_72",
    titleKey: "quest_q21_title",
    detailKey: "quest_q21_detail",
    reward: 60,
    goal: { kind: "campaignReach", level: 72 },
    deepLink: "play",
  },
  {
    id: "q22_master_12",
    titleKey: "quest_q22_title",
    detailKey: "quest_q22_detail",
    reward: 55,
    goal: { kind: "masterBest", count: 12 },
    deepLink: "modes",
  },
  {
    id: "q23_campaign_100",
    titleKey: "quest_q23_title",
    detailKey: "quest_q23_detail",
    reward: 80,
    goal: { kind: "campaignClears", count: 100 },
    deepLink: "play",
  },
  {
    id: "q24_rush_80_total",
    titleKey: "quest_q24_title",
    detailKey: "quest_q24_detail",
    reward: 75,
    goal: { kind: "rushClearsTotal", count: 80 },
    deepLink: "rush",
  },
  {
    id: "q25_reach_180",
    titleKey: "quest_q25_title",
    detailKey: "quest_q25_detail",
    reward: 120,
    goal: { kind: "campaignReach", level: 180 },
    deepLink: "play",
  },
] as const;

export type QuestProgressInput = {
  clearedCampaign: readonly number[];
  dailyClaimedOn: string;
  rushClearsTotal: number;
  rushBest: number;
  constellations: readonly string[];
  duelStarted: number;
  masterBest: number;
  echoBest: number;
  questClaims: readonly string[];
};

export type QuestView = {
  quest: QuestDef;
  current: number;
  target: number;
  ready: boolean;
  claimed: boolean;
  /** 0–1 */
  ratio: number;
};

function goalProgress(goal: QuestGoal, input: QuestProgressInput): { current: number; target: number } {
  switch (goal.kind) {
    case "campaignClears":
      return { current: input.clearedCampaign.length, target: goal.count };
    case "campaignReach": {
      const peak = input.clearedCampaign.length > 0 ? Math.max(...input.clearedCampaign) : 0;
      return { current: Math.min(peak, goal.level), target: goal.level };
    }
    case "dailyClaim":
      return { current: input.dailyClaimedOn.length > 0 ? 1 : 0, target: goal.count };
    case "rushClearsTotal":
      return { current: Math.max(0, input.rushClearsTotal), target: goal.count };
    case "rushBest":
      return { current: Math.max(0, input.rushBest), target: goal.count };
    case "constellation":
      return { current: input.constellations.length, target: goal.count };
    case "duelStarted":
      return { current: Math.max(0, input.duelStarted), target: goal.count };
    case "masterBest":
      return { current: Math.max(0, input.masterBest), target: goal.count };
    case "echoBest":
      return { current: Math.max(0, input.echoBest), target: goal.count };
  }
}

export function questView(quest: QuestDef, input: QuestProgressInput): QuestView {
  const claimed = input.questClaims.includes(quest.id);
  const { current, target } = goalProgress(quest.goal, input);
  const capped = Math.min(current, target);
  const ready = !claimed && capped >= target;
  return {
    quest,
    current: capped,
    target,
    ready,
    claimed,
    ratio: target <= 0 ? 1 : Math.min(1, capped / target),
  };
}

export function activeQuest(input: QuestProgressInput): QuestView | null {
  for (const quest of QUESTS) {
    const view = questView(quest, input);
    if (!view.claimed) return view;
  }
  return null;
}

export function upcomingQuests(input: QuestProgressInput, limit = 2): QuestView[] {
  const active = activeQuest(input);
  if (!active) return [];
  const start = QUESTS.findIndex((q) => q.id === active.quest.id);
  if (start < 0) return [];
  return QUESTS.slice(start + 1, start + 1 + limit).map((quest) => questView(quest, input));
}

export function isQuestPathComplete(input: QuestProgressInput): boolean {
  return QUESTS.every((quest) => input.questClaims.includes(quest.id));
}
