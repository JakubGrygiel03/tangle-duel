import type { GraphEdge, GraphNode, Point } from "./graph";

/** Kamienie milowe kampanii — co 5 poziomów. */
export type ConstellationId =
  | "diamond"
  | "wings"
  | "cat"
  | "boat"
  | "heart"
  | "bird"
  | "tree"
  | "fish"
  | "pegasus"
  | "wolf"
  | "crown"
  | "lantern";

export type ConstellationKind = "animal" | "plant" | "object";

export type Constellation = {
  id: ConstellationId;
  level: number;
  name: string;
  kind: ConstellationKind;
  /** Krótki podpis po rozplątaniu. */
  reveal: string;
  /** Punkty docelowe w układzie jednostkowym (−1…1). */
  solved: readonly Point[];
  edges: readonly GraphEdge[];
};

function link(a: number, b: number): GraphEdge {
  return { a, b };
}

/**
 * Czytelne sylwetki konstelacji (zwierzęta, rośliny, przedmioty).
 * y rośnie w dół. Każda figura jest planarna w stanie solved.
 */
export const CONSTELLATIONS: readonly Constellation[] = [
  {
    id: "diamond",
    level: 5,
    name: "Diament",
    kind: "object",
    reveal: "Konstelacja Diament",
    // Klasyczny kryształ: czubek, barki, spód + fasetka środka.
    solved: [
      { x: 0, y: -0.78 },
      { x: 0.58, y: -0.18 },
      { x: 0.36, y: 0.62 },
      { x: -0.36, y: 0.62 },
      { x: -0.58, y: -0.18 },
      { x: 0, y: 0.12 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(3, 4),
      link(4, 0),
      link(1, 5),
      link(4, 5),
      link(2, 5),
      link(3, 5),
    ],
  },
  {
    id: "wings",
    level: 10,
    name: "Motyl",
    kind: "animal",
    reveal: "Konstelacja Motyla",
    // Ciało w pionie + dwa skrzydła (górne większe).
    solved: [
      { x: 0, y: -0.62 },
      { x: 0, y: 0.05 },
      { x: 0, y: 0.58 },
      { x: -0.68, y: -0.42 },
      { x: -0.72, y: 0.08 },
      { x: -0.42, y: 0.32 },
      { x: 0.68, y: -0.42 },
      { x: 0.72, y: 0.08 },
      { x: 0.42, y: 0.32 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(0, 3),
      link(3, 4),
      link(4, 5),
      link(5, 1),
      link(0, 6),
      link(6, 7),
      link(7, 8),
      link(8, 1),
    ],
  },
  {
    id: "cat",
    level: 15,
    name: "Kot",
    kind: "animal",
    reveal: "Konstelacja Kota",
    // Uszy, głowa, tułów, ogon w prawo.
    solved: [
      { x: -0.38, y: -0.72 },
      { x: 0.12, y: -0.72 },
      { x: -0.42, y: -0.28 },
      { x: 0.22, y: -0.28 },
      { x: -0.28, y: 0.18 },
      { x: 0.18, y: 0.18 },
      { x: -0.08, y: 0.62 },
      { x: 0.55, y: 0.28 },
      { x: 0.72, y: -0.08 },
      { x: -0.05, y: -0.08 },
    ],
    edges: [
      link(0, 2),
      link(1, 3),
      link(2, 9),
      link(3, 9),
      link(2, 4),
      link(3, 5),
      link(4, 6),
      link(5, 6),
      link(4, 9),
      link(5, 9),
      link(5, 7),
      link(7, 8),
    ],
  },
  {
    id: "boat",
    level: 20,
    name: "Łódź",
    kind: "object",
    reveal: "Konstelacja Łodzi",
    // Kadłub + maszt + trójkątny żagiel (bez przecięć).
    solved: [
      { x: -0.72, y: 0.35 },
      { x: -0.2, y: 0.6 },
      { x: 0.35, y: 0.6 },
      { x: 0.72, y: 0.3 },
      { x: 0, y: 0.2 },
      { x: 0, y: -0.7 },
      { x: 0.42, y: -0.05 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(0, 4),
      link(3, 4),
      link(4, 5),
      link(5, 6),
      link(6, 4),
    ],
  },
  {
    id: "heart",
    level: 25,
    name: "Kwiat",
    kind: "plant",
    reveal: "Konstelacja Kwiatu",
    // Środek + 5 płatków + łodyga.
    solved: [
      { x: 0, y: -0.12 },
      { x: 0, y: -0.68 },
      { x: -0.58, y: -0.38 },
      { x: -0.48, y: 0.28 },
      { x: 0.48, y: 0.28 },
      { x: 0.58, y: -0.38 },
      { x: 0, y: 0.42 },
      { x: 0, y: 0.72 },
    ],
    edges: [
      link(0, 1),
      link(0, 2),
      link(0, 3),
      link(0, 4),
      link(0, 5),
      link(1, 2),
      link(2, 3),
      link(3, 6),
      link(4, 6),
      link(4, 5),
      link(5, 1),
      link(6, 7),
    ],
  },
  {
    id: "bird",
    level: 30,
    name: "Jaskółka",
    kind: "animal",
    reveal: "Konstelacja Jaskółki",
    // Profil w locie: dziób, skrzydło, ogon widełki.
    solved: [
      { x: 0.72, y: -0.08 },
      { x: 0.28, y: -0.22 },
      { x: -0.05, y: -0.58 },
      { x: -0.42, y: -0.22 },
      { x: -0.72, y: -0.48 },
      { x: -0.55, y: 0.08 },
      { x: -0.72, y: 0.42 },
      { x: -0.15, y: 0.32 },
      { x: 0.32, y: 0.18 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(3, 4),
      link(3, 5),
      link(5, 6),
      link(5, 7),
      link(7, 8),
      link(8, 0),
      link(1, 8),
      link(1, 3),
    ],
  },
  {
    id: "tree",
    level: 35,
    name: "Sosna",
    kind: "plant",
    reveal: "Konstelacja Sosny",
    // Pień + warstwy korony (drzewko bez krzyżujących krawędzi).
    solved: [
      { x: 0, y: 0.78 },
      { x: 0, y: 0.38 },
      { x: 0, y: 0.02 },
      { x: -0.55, y: 0.12 },
      { x: 0.55, y: 0.12 },
      { x: -0.4, y: -0.32 },
      { x: 0.4, y: -0.32 },
      { x: 0, y: -0.72 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(2, 4),
      link(3, 5),
      link(4, 6),
      link(5, 7),
      link(6, 7),
      link(2, 7),
    ],
  },
  {
    id: "fish",
    level: 40,
    name: "Ryba",
    kind: "animal",
    reveal: "Konstelacja Ryby",
    // Głowa w prawo, ciało, ogon widełki w lewo + płetwa.
    solved: [
      { x: 0.75, y: 0 },
      { x: 0.38, y: -0.32 },
      { x: -0.05, y: -0.42 },
      { x: -0.38, y: -0.22 },
      { x: -0.55, y: 0 },
      { x: -0.38, y: 0.22 },
      { x: -0.05, y: 0.42 },
      { x: 0.38, y: 0.32 },
      { x: -0.78, y: -0.38 },
      { x: -0.78, y: 0.38 },
      { x: 0.05, y: -0.68 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(3, 4),
      link(4, 5),
      link(5, 6),
      link(6, 7),
      link(7, 0),
      link(4, 8),
      link(4, 9),
      link(8, 9),
      link(2, 10),
      link(1, 7),
    ],
  },
  {
    id: "pegasus",
    level: 45,
    name: "Pegaz",
    kind: "animal",
    reveal: "Konstelacja Pegaza",
    // Głowa, skrzydło, tułów, nogi.
    solved: [
      { x: 0.62, y: -0.58 },
      { x: 0.28, y: -0.32 },
      { x: -0.08, y: -0.55 },
      { x: -0.42, y: -0.22 },
      { x: -0.18, y: 0.12 },
      { x: 0.32, y: 0.05 },
      { x: -0.58, y: 0.38 },
      { x: -0.22, y: 0.62 },
      { x: 0.22, y: 0.58 },
      { x: 0.58, y: 0.32 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(3, 4),
      link(4, 5),
      link(5, 1),
      link(3, 6),
      link(4, 7),
      link(4, 8),
      link(5, 9),
      link(8, 9),
    ],
  },
  {
    id: "wolf",
    level: 50,
    name: "Wilk",
    kind: "animal",
    reveal: "Konstelacja Wilka",
    // Profil w prawo: pysk, ucho, grzbiet, ogon, łapy.
    solved: [
      { x: 0.72, y: -0.12 },
      { x: 0.38, y: -0.28 },
      { x: 0.22, y: -0.62 },
      { x: -0.05, y: -0.22 },
      { x: -0.42, y: -0.42 },
      { x: -0.72, y: -0.58 },
      { x: -0.48, y: 0.12 },
      { x: -0.28, y: 0.55 },
      { x: 0.18, y: 0.48 },
      { x: 0.48, y: 0.15 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(1, 3),
      link(3, 4),
      link(4, 5),
      link(4, 6),
      link(6, 7),
      link(6, 8),
      link(8, 9),
      link(9, 0),
      link(3, 9),
    ],
  },
  {
    id: "crown",
    level: 55,
    name: "Liść",
    kind: "plant",
    reveal: "Konstelacja Liścia",
    // Owal z nerwem środkowym i żyłkami.
    solved: [
      { x: 0, y: -0.75 },
      { x: -0.38, y: -0.35 },
      { x: 0.38, y: -0.35 },
      { x: -0.55, y: 0.15 },
      { x: 0.55, y: 0.15 },
      { x: -0.22, y: 0.52 },
      { x: 0.22, y: 0.52 },
      { x: 0, y: 0.72 },
      { x: 0, y: -0.05 },
    ],
    edges: [
      link(0, 1),
      link(0, 2),
      link(1, 3),
      link(2, 4),
      link(3, 5),
      link(4, 6),
      link(5, 7),
      link(6, 7),
      link(0, 8),
      link(8, 7),
      link(1, 8),
      link(2, 8),
      link(3, 8),
      link(4, 8),
    ],
  },
  {
    id: "lantern",
    level: 60,
    name: "Sowa",
    kind: "animal",
    reveal: "Konstelacja Sowy",
    // Uszy, okrągła głowa/tułów, skrzydła, nogi.
    solved: [
      { x: -0.32, y: -0.72 },
      { x: 0.32, y: -0.72 },
      { x: -0.52, y: -0.28 },
      { x: 0.52, y: -0.28 },
      { x: -0.48, y: 0.28 },
      { x: 0.48, y: 0.28 },
      { x: -0.18, y: 0.62 },
      { x: 0.18, y: 0.62 },
      { x: 0, y: -0.12 },
      { x: 0, y: 0.22 },
    ],
    edges: [
      link(0, 2),
      link(1, 3),
      link(0, 1),
      link(2, 3),
      link(2, 4),
      link(3, 5),
      link(4, 6),
      link(5, 7),
      link(6, 7),
      link(2, 8),
      link(3, 8),
      link(4, 9),
      link(5, 9),
      link(8, 9),
    ],
  },
];

const byLevel = new Map(CONSTELLATIONS.map((item) => [item.level, item]));
const byId = new Map(CONSTELLATIONS.map((item) => [item.id, item]));

export function isConstellationLevel(level: number): boolean {
  return byLevel.has(Math.floor(level));
}

export function constellationForLevel(level: number): Constellation | null {
  return byLevel.get(Math.floor(level)) ?? null;
}

export function getConstellation(id: ConstellationId): Constellation {
  return byId.get(id) ?? CONSTELLATIONS[0]!;
}

export function constellationKindLabel(kind: ConstellationKind): string {
  if (kind === "animal") return "Zwierzę";
  if (kind === "plant") return "Roślina";
  return "Przedmiot";
}

/** Bonus za pierwsze odkrycie konstelacji. */
export const CONSTELLATION_CRYSTAL_REWARD = 30;

/** Promień „studni” magnesu względem promienia areny. Krótki — tylko przy gnieździe. */
export const MAGNET_RADIUS_FACTOR = 0.1;
/** Po puszczeniu — dociągnij, jeśli palec jest już w studni. */
export const MAGNET_SNAP_FACTOR = 0.07;
/** Dopasowanie figury: węzeł w swoim gnieździe. */
export const MATCH_RADIUS_FACTOR = 0.18;

function ownWell(outline: readonly Point[], index: number | undefined): Point | null {
  if (index === undefined) return null;
  return outline[index] ?? null;
}

/** Inny kryształ już siedzi w tym gnieździe — nie wciągaj drugiego. */
function wellTaken(
  home: Point,
  selfId: number,
  nodes: readonly GraphNode[] | undefined,
  arenaRadius: number,
): boolean {
  if (!nodes) return false;
  const limit = Math.max(14, arenaRadius * 0.055);
  for (const node of nodes) {
    if (node.id === selfId) continue;
    if (Math.hypot(node.x - home.x, node.y - home.y) <= limit) return true;
  }
  return false;
}

/**
 * Delikatny magnes wyłącznie do własnego gniazda i tylko z bliska.
 * Cudze studnie są ignorowane, żeby figura nie składała się w obcy kształt.
 */
export function magnetTowardOutline(
  x: number,
  y: number,
  outline: readonly Point[],
  arenaRadius: number,
  preferIndex?: number,
  nodes?: readonly GraphNode[],
): Point {
  const home = ownWell(outline, preferIndex);
  if (!home) return { x, y };
  if (wellTaken(home, preferIndex ?? -1, nodes, arenaRadius)) return { x, y };
  const reach = Math.max(20, arenaRadius * MAGNET_RADIUS_FACTOR);
  const dist = Math.hypot(home.x - x, home.y - y);
  if (dist > reach || dist < 0.4) return { x, y };
  const closeness = 1 - dist / reach;
  const pull = 0.08 + 0.42 * closeness * closeness;
  return {
    x: x + (home.x - x) * pull,
    y: y + (home.y - y) * pull,
  };
}

/** Przy puszczeniu: dociągnij do własnego gniazda, jeśli palec jest w studni. */
export function snapToOutlineIfClose(
  x: number,
  y: number,
  outline: readonly Point[],
  arenaRadius: number,
  preferIndex?: number,
  nodes?: readonly GraphNode[],
): Point {
  const home = ownWell(outline, preferIndex);
  if (!home) return { x, y };
  if (wellTaken(home, preferIndex ?? -1, nodes, arenaRadius)) return { x, y };
  const snap = Math.max(16, arenaRadius * MAGNET_SNAP_FACTOR);
  if (Math.hypot(home.x - x, home.y - y) > snap) return { x, y };
  return { x: home.x, y: home.y };
}

/**
 * Po rozplątaniu dosuń tylko kryształy, które już stoją przy swoim gnieździe.
 * Dalekie węzły zostają tam, gdzie gracz je położył.
 */
export function settleNodesTowardOutline(
  nodes: readonly GraphNode[],
  outline: readonly Point[],
  arenaRadius: number,
): void {
  if (!outline.length || nodes.length !== outline.length) return;
  const reach = Math.max(18, arenaRadius * MAGNET_RADIUS_FACTOR);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const home = outline[i];
    if (!node || !home) continue;
    if (wellTaken(home, node.id, nodes, arenaRadius)) continue;
    const dist = Math.hypot(home.x - node.x, home.y - node.y);
    if (dist > reach || dist < 0.5) continue;
    node.tx = node.x + (home.x - node.x) * 0.14;
    node.ty = node.y + (home.y - node.y) * 0.14;
  }
}

/**
 * Figura złożona: każdy węzeł w swoim gnieździe (to samo ID co solved).
 */
export function isConstellationMatched(
  nodes: readonly GraphNode[],
  outline: readonly Point[],
  arenaRadius: number,
): boolean {
  if (!outline.length || nodes.length !== outline.length) return false;
  const limit = Math.max(26, arenaRadius * MATCH_RADIUS_FACTOR);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const home = outline[i];
    if (!node || !home) return false;
    if (Math.hypot(node.x - home.x, node.y - home.y) > limit) return false;
  }
  return true;
}
