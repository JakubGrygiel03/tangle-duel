import type { GraphEdge, Point } from "./graph";

/** Kamienie milowe kampanii — co 5 poziomów. */
export type ConstellationId = "diamond" | "wings" | "pegasus" | "wolf";

export type Constellation = {
  id: ConstellationId;
  level: number;
  name: string;
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
 * Minimalistyczne figury „origami / konstelacja”.
 * Współrzędne trzymamy w przestrzeni jednostkowej; silnik skaluje je do areny.
 */
export const CONSTELLATIONS: readonly Constellation[] = [
  {
    id: "diamond",
    level: 5,
    name: "Diament",
    reveal: "Konstelacja Diament",
    solved: [
      { x: 0, y: -0.72 },
      { x: 0.58, y: 0 },
      { x: 0, y: 0.72 },
      { x: -0.58, y: 0 },
      { x: 0, y: 0 },
    ],
    edges: [link(0, 1), link(1, 2), link(2, 3), link(3, 0), link(0, 4), link(2, 4)],
  },
  {
    id: "wings",
    level: 10,
    name: "Skrzydła",
    reveal: "Konstelacja Skrzydeł",
    solved: [
      { x: 0, y: 0.08 },
      { x: -0.72, y: -0.42 },
      { x: -0.38, y: -0.68 },
      { x: 0.38, y: -0.68 },
      { x: 0.72, y: -0.42 },
      { x: -0.55, y: 0.55 },
      { x: 0.55, y: 0.55 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 0),
      link(0, 3),
      link(3, 4),
      link(4, 0),
      link(0, 5),
      link(0, 6),
      link(5, 1),
      link(6, 4),
    ],
  },
  {
    id: "pegasus",
    level: 15,
    name: "Pegaz",
    reveal: "Konstelacja Pegaza",
    solved: [
      { x: -0.12, y: -0.55 },
      { x: 0.42, y: -0.72 },
      { x: 0.68, y: -0.28 },
      { x: 0.22, y: 0.05 },
      { x: -0.18, y: 0.35 },
      { x: -0.55, y: 0.08 },
      { x: -0.62, y: 0.62 },
      { x: 0.08, y: 0.72 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(3, 0),
      link(0, 4),
      link(4, 5),
      link(5, 0),
      link(4, 6),
      link(4, 7),
      link(3, 7),
    ],
  },
  {
    id: "wolf",
    level: 20,
    name: "Wilk",
    reveal: "Konstelacja Wilka",
    solved: [
      { x: -0.35, y: -0.62 },
      { x: 0.35, y: -0.62 },
      { x: 0.58, y: -0.18 },
      { x: 0.28, y: 0.22 },
      { x: 0, y: 0.55 },
      { x: -0.28, y: 0.22 },
      { x: -0.58, y: -0.18 },
      { x: 0, y: -0.12 },
    ],
    edges: [
      link(0, 1),
      link(1, 2),
      link(2, 3),
      link(3, 4),
      link(4, 5),
      link(5, 6),
      link(6, 0),
      link(0, 7),
      link(1, 7),
      link(3, 7),
      link(5, 7),
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

/** Bonus za pierwsze odkrycie konstelacji. */
export const CONSTELLATION_CRYSTAL_REWARD = 30;
