import type { MessageKey } from "@/lib/i18n/messages";

/** Deep-link z paska misji na ekran / tryb. */
export type QuestDeepLink = "play" | "rush" | "modes" | "daily" | "duel" | "levels";

export type QuestGoal =
  | { kind: "campaignClears"; count: number }
  | { kind: "campaignReach"; level: number }
  | { kind: "dailyClaim"; count: number }
  | { kind: "rushClearsTotal"; count: number }
  | { kind: "constellation"; count: number }
  | { kind: "duelStarted"; count: number };

export type QuestDef = {
  id: string;
  titleKey: MessageKey;
  detailKey: MessageKey;
  reward: number;
  goal: QuestGoal;
  deepLink: QuestDeepLink;
};

/** Liniowa ścieżka misji — aktywna = pierwsza nieodebrana. */
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
] as const;

export type QuestProgressInput = {
  clearedCampaign: readonly number[];
  dailyClaimedOn: string;
  rushClearsTotal: number;
  constellations: readonly string[];
  duelStarted: number;
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
      return { current: input.dailyClaimedOn ? 1 : 0, target: goal.count };
    case "rushClearsTotal":
      return { current: input.rushClearsTotal, target: goal.count };
    case "constellation":
      return { current: input.constellations.length, target: goal.count };
    case "duelStarted":
      return { current: input.duelStarted, target: goal.count };
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

/** Pierwsza nieodebrana misja (albo null, gdy ścieżka skończona). */
export function activeQuest(input: QuestProgressInput): QuestView | null {
  for (const quest of QUESTS) {
    const view = questView(quest, input);
    if (!view.claimed) return view;
  }
  return null;
}

/** Podgląd kolejnych 1–2 misji za aktywną. */
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
