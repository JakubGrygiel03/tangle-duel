import {
  constellationForLevel,
  type ConstellationId,
} from "./constellations";
import { findIntersections, segmentIntersection } from "./intersections";

export type Point = {
  x: number;
  y: number;
};

export type GraphEdge = {
  a: number;
  b: number;
};

export type GraphNode = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  pluck: number;
  grab: number;
};

export type Arena = {
  cx: number;
  cy: number;
  radius: number;
};

/** Wolny pas kolumny: dół górnego paska i góra dolnych przycisków. */
export type ArenaChrome = {
  top: number;
  bottom: number;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  arena: Arena;
  level: number;
  /** Dolne ograniczenie ruchów policzone na starcie układu. */
  minimumMoves: number;
  /** Subtelny zarys figury (konstelacja) — punkty w pikselach CSS. */
  outline?: Point[];
  /** Nazwa konstelacji do flasha po rozplątaniu. */
  constellationName?: string;
  constellationId?: ConstellationId;
  isConstellation?: boolean;
};

export type LevelPlan = {
  solved: Point[];
  tangled: Point[];
  edges: GraphEdge[];
  crossings: number;
  constellationName?: string;
  constellationId?: ConstellationId;
  isConstellation?: boolean;
};

export type LevelSpec = {
  nodes: number;
  extraEdges: number;
  minCrossings: number;
  innerNodes: number;
};

/** Średnica celu dotyku. Wizualny kryształ jest mniejszy. */
export const TOUCH_RADIUS = 44;

/** Kampania ma stałą długość; potem idą levele nieskończone. */
export const CAMPAIGN_LEVELS = 60;
/** Górny sensowny limit węzłów pod kciukiem. */
export const MAX_NODES = 16;

const MIN_DRAG_GAP = 22;
const DEGENERATE_GAP = 12;
const SPRING = 22;

function edgeCap(nodes: number): number {
  return Math.max(0, 2 * nodes - 5);
}

export function specsForLevel(level: number): LevelSpec {
  const safe = Math.max(1, Math.floor(level));

  // Rozdział 1 — pierwsze kroki.
  if (safe <= 10) {
    if (safe <= 3) {
      return {
        nodes: safe === 1 ? 5 : 6,
        extraEdges: safe,
        minCrossings: safe === 1 ? 1 : 2,
        innerNodes: 1,
      };
    }
    if (safe <= 7) {
      const nodes = safe === 4 ? 7 : safe === 7 ? 9 : 8;
      return {
        nodes,
        extraEdges: 3 + (safe - 4),
        minCrossings: 3,
        innerNodes: 2,
      };
    }
    const nodes = safe <= 9 ? 10 : 11;
    return {
      nodes,
      extraEdges: Math.min(edgeCap(nodes), 5 + (safe - 8)),
      minCrossings: 4 + Math.floor((safe - 8) / 2),
      innerNodes: 0,
    };
  }

  // Rozdział 2 — gęstsza sieć.
  if (safe <= 20) {
    const nodes = Math.min(MAX_NODES, 11 + Math.floor((safe - 11) / 3));
    return {
      nodes,
      extraEdges: Math.min(edgeCap(nodes), 6 + Math.floor((safe - 11) / 2)),
      minCrossings: 5 + Math.floor((safe - 11) / 2),
      innerNodes: safe <= 14 ? 1 : 0,
    };
  }

  // Rozdział 3 — więcej przecięć.
  if (safe <= 30) {
    const nodes = Math.min(MAX_NODES, 12 + Math.floor((safe - 21) / 4));
    return {
      nodes,
      extraEdges: Math.min(edgeCap(nodes), 8 + Math.floor((safe - 21) / 2)),
      minCrossings: 7 + Math.floor((safe - 21) / 2),
      innerNodes: 0,
    };
  }

  // Rozdział 4 — duże konstelacje.
  if (safe <= 40) {
    const nodes = Math.min(MAX_NODES, 13 + Math.floor((safe - 31) / 3));
    return {
      nodes,
      extraEdges: Math.min(edgeCap(nodes), 10 + Math.floor((safe - 31) / 2)),
      minCrossings: 9 + Math.floor((safe - 31) / 2),
      innerNodes: 0,
    };
  }

  // Rozdział 5 — gęstość przy limicie węzłów.
  if (safe <= 50) {
    const nodes = Math.min(MAX_NODES, 14 + Math.floor((safe - 41) / 4));
    return {
      nodes,
      extraEdges: Math.min(edgeCap(nodes), 12 + Math.floor((safe - 41) / 2)),
      minCrossings: 11 + Math.floor((safe - 41) / 2),
      innerNodes: 0,
    };
  }

  // Rozdział 6 — finał kampanii.
  if (safe <= CAMPAIGN_LEVELS) {
    const nodes = MAX_NODES;
    return {
      nodes,
      extraEdges: Math.min(edgeCap(nodes), 14 + Math.floor((safe - 51) / 2)),
      minCrossings: 13 + Math.floor((safe - 51) / 2),
      innerNodes: 0,
    };
  }

  // Nieskończone: ten sam limit węzłów, trudność rośnie wolniej.
  const over = safe - CAMPAIGN_LEVELS;
  const nodes = MAX_NODES;
  const bump = Math.floor(Math.sqrt(over));
  return {
    nodes,
    extraEdges: Math.min(edgeCap(nodes), 16 + bump),
    minCrossings: Math.min(28, 15 + bump + Math.floor(over / 8)),
    innerNodes: 0,
  };
}

export function isCampaignLevel(level: number): boolean {
  return level >= 1 && level <= CAMPAIGN_LEVELS;
}

export function isEndlessUnlocked(clearedCampaign: readonly number[]): boolean {
  return clearedCampaign.includes(CAMPAIGN_LEVELS);
}

/** Ułamek promienia, w którym leżą środki kryształów. Reszta zostaje na obwód. */
const INSIDE = 0.8;
const CRYSTAL_PAD = 18;
/** Odstęp pierścienia od krawędzi kolumny i od HUD / przycisków. */
const ARENA_GUTTER = 18;

/**
 * Okrąg w wizualnym środku wolnego pasa między górnym paskiem a dolnymi przyciskami.
 * Promień bierze mniejszy z szerokości kolumny i wysokości tego pasa.
 */
export function computeArena(width: number, height: number, chrome?: ArenaChrome): Arena {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  let top = chrome?.top ?? Math.min(132, Math.max(100, h * 0.135));
  let bottom = chrome?.bottom ?? Math.min(100, Math.max(72, h * 0.09));
  const limit = h * 0.46;
  top = Math.min(Math.max(0, top), limit);
  bottom = Math.min(Math.max(0, bottom), limit);
  if (top + bottom > h - 48) {
    const scale = (h - 48) / Math.max(1, top + bottom);
    top *= scale;
    bottom *= scale;
  }
  const free = Math.max(32, h - top - bottom);
  const fitted = Math.min(w, free) / 2 - ARENA_GUTTER;
  const radius = Math.max(16, Math.min(fitted, w / 2 - 4, free / 2 - 4));
  return {
    cx: w / 2,
    cy: top + free / 2,
    radius,
  };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function link(a: number, b: number): GraphEdge {
  return a < b ? { a, b } : { a: b, b: a };
}

function hasEdge(edges: readonly GraphEdge[], a: number, b: number): boolean {
  const key = edgeKey(a, b);
  return edges.some((edge) => edgeKey(edge.a, edge.b) === key);
}

function sharesVertex(edge: GraphEdge, a: number, b: number): boolean {
  return edge.a === a || edge.b === a || edge.a === b || edge.b === b;
}

function crossesExisting(
  points: readonly Point[],
  edges: readonly GraphEdge[],
  a: number,
  b: number,
): boolean {
  const start = points[a];
  const end = points[b];
  if (!start || !end) return true;

  for (const edge of edges) {
    if (sharesVertex(edge, a, b)) continue;
    const c = points[edge.a];
    const d = points[edge.b];
    if (!c || !d) continue;
    if (segmentIntersection(start, end, c, d)) return true;
  }

  return false;
}

function sunflower(count: number, rnd: () => number): Point[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const spin = rnd() * Math.PI * 2;
  const points: Point[] = [];

  for (let index = 0; index < count; index++) {
    const radius = Math.sqrt((index + 0.5) / count) * 0.8;
    const angle = index * golden + spin;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  return points;
}

function minimumSpanningTree(points: readonly Point[]): GraphEdge[] {
  const count = points.length;
  const inTree = new Array<boolean>(count).fill(false);
  const best = new Array<number>(count).fill(Number.POSITIVE_INFINITY);
  const parent = new Array<number>(count).fill(-1);
  best[0] = 0;
  const edges: GraphEdge[] = [];

  for (let grown = 0; grown < count; grown++) {
    let next = -1;
    for (let index = 0; index < count; index++) {
      if (inTree[index]) continue;
      if (next === -1 || best[index]! < best[next]!) next = index;
    }
    if (next < 0) break;
    inTree[next] = true;
    const from = parent[next] ?? -1;
    if (from >= 0) edges.push(link(from, next));

    const current = points[next];
    if (!current) continue;
    for (let other = 0; other < count; other++) {
      if (inTree[other]) continue;
      const candidate = points[other];
      if (!candidate) continue;
      const distance = Math.hypot(current.x - candidate.x, current.y - candidate.y);
      if (distance < best[other]!) {
        best[other] = distance;
        parent[other] = next;
      }
    }
  }

  return edges;
}

function addPlanarEdges(
  points: readonly Point[],
  edges: GraphEdge[],
  extras: number,
  rnd: () => number,
): void {
  const candidates: { a: number; b: number; distance: number }[] = [];

  for (let i = 0; i < points.length; i++) {
    const from = points[i];
    if (!from) continue;
    for (let j = i + 1; j < points.length; j++) {
      if (hasEdge(edges, i, j)) continue;
      const to = points[j];
      if (!to) continue;
      candidates.push({
        a: i,
        b: j,
        distance: Math.hypot(from.x - to.x, from.y - to.y),
      });
    }
  }

  candidates.sort((left, right) => left.distance - right.distance);

  let added = 0;
  for (const candidate of candidates) {
    if (added >= extras) break;
    if (rnd() > 0.62) continue;
    if (crossesExisting(points, edges, candidate.a, candidate.b)) continue;
    edges.push(link(candidate.a, candidate.b));
    added += 1;
  }

  if (added >= extras) return;

  for (const candidate of candidates) {
    if (added >= extras) break;
    if (hasEdge(edges, candidate.a, candidate.b)) continue;
    if (crossesExisting(points, edges, candidate.a, candidate.b)) continue;
    edges.push(link(candidate.a, candidate.b));
    added += 1;
  }
}

function disjointPairs(edges: readonly GraphEdge[]): [GraphEdge, GraphEdge][] {
  const pairs: [GraphEdge, GraphEdge][] = [];
  for (let i = 0; i < edges.length; i++) {
    const first = edges[i];
    if (!first) continue;
    for (let j = i + 1; j < edges.length; j++) {
      const second = edges[j];
      if (!second || sharesVertex(first, second.a, second.b)) continue;
      pairs.push([first, second]);
    }
  }
  return pairs;
}

function ensureDisjointPair(points: readonly Point[], edges: GraphEdge[]): boolean {
  if (disjointPairs(edges).length > 0) return true;

  let best: { a: number; b: number; distance: number } | null = null;
  for (let i = 0; i < points.length; i++) {
    const from = points[i];
    if (!from) continue;
    for (let j = i + 1; j < points.length; j++) {
      if (hasEdge(edges, i, j)) continue;
      const disjoint = edges.some((edge) => !sharesVertex(edge, i, j));
      if (!disjoint || crossesExisting(points, edges, i, j)) continue;
      const to = points[j];
      if (!to) continue;
      const distance = Math.hypot(from.x - to.x, from.y - to.y);
      if (!best || distance < best.distance) best = { a: i, b: j, distance };
    }
  }

  if (!best) return false;
  edges.push(link(best.a, best.b));
  return disjointPairs(edges).length > 0;
}

function crossingCount(points: readonly Point[], edges: readonly GraphEdge[]): number {
  return findIntersections(nodesFrom(points), edges).length;
}

function layoutFromOrder(order: readonly number[], inner: ReadonlySet<number>): Point[] | null {
  const count = order.length;
  const points: Point[] = new Array(count);

  for (let slot = 0; slot < count; slot++) {
    const id = order[slot];
    if (id === undefined || id < 0) return null;
    const angle = -Math.PI / 2 + (slot / count) * Math.PI * 2;
    const radius = inner.has(id) ? 0.4 + (slot % 3) * 0.05 : 0.92;
    points[id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }

  if (points.some((point) => !point)) return null;
  return points;
}

function shuffleIds(ids: number[], rnd: () => number): void {
  for (let index = ids.length - 1; index > 0; index--) {
    const swap = Math.floor(rnd() * (index + 1));
    const current = ids[index];
    const other = ids[swap];
    if (current === undefined || other === undefined) continue;
    ids[index] = other;
    ids[swap] = current;
  }
}

/**
 * Cztery końce rozłącznej pary strun lądują na przemian na okręgu,
 * więc przekątne czworokąta się przecinają. Potem zamiany miejsc
 * podnoszą liczbę przecięć do progu poziomu.
 */
function tanglePoints(
  solved: readonly Point[],
  edges: readonly GraphEdge[],
  innerNodes: number,
  minCrossings: number,
  rnd: () => number,
): { points: Point[]; crossings: number } | null {
  const pairs = disjointPairs(edges);
  const chosen = pairs[Math.floor(rnd() * pairs.length)];
  if (!chosen) return null;

  const [first, second] = chosen;
  const count = solved.length;
  const gap = Math.max(1, Math.floor(count / 4));
  const base = Math.floor(rnd() * count);
  const slots = [0, 1, 2, 3].map((step) => (base + step * gap) % count);
  if (new Set(slots).size !== 4) return null;

  const order = new Array<number>(count).fill(-1);
  const lockedIds = [first.a, second.a, first.b, second.b];
  slots.forEach((slot, index) => {
    const id = lockedIds[index];
    if (id === undefined) return;
    order[slot] = id;
  });

  const rest = solved.map((_, index) => index).filter((index) => !lockedIds.includes(index));
  shuffleIds(rest, rnd);

  let cursor = 0;
  for (let slot = 0; slot < count; slot++) {
    if (order[slot]! >= 0) continue;
    const id = rest[cursor];
    if (id === undefined) return null;
    order[slot] = id;
    cursor += 1;
  }

  const inner = new Set<number>();
  const innerPool = rest.slice();
  shuffleIds(innerPool, rnd);
  for (const id of innerPool) {
    if (inner.size >= innerNodes) break;
    inner.add(id);
  }

  let points = layoutFromOrder(order, inner);
  if (!points) return null;
  let score = crossingCount(points, edges);
  const swaps = count * 36;

  for (let step = 0; step < swaps && score < minCrossings; step++) {
    const left = Math.floor(rnd() * count);
    const right = Math.floor(rnd() * count);
    if (left === right) continue;
    const leftId = order[left];
    const rightId = order[right];
    if (leftId === undefined || rightId === undefined) continue;
    order[left] = rightId;
    order[right] = leftId;

    const trial = layoutFromOrder(order, inner);
    const next = trial ? crossingCount(trial, edges) : -1;
    if (trial && next >= score) {
      points = trial;
      score = next;
    } else {
      order[left] = leftId;
      order[right] = rightId;
    }
  }

  if (score < 1) return null;
  return { points, crossings: score };
}

function nodesFrom(points: readonly Point[]): GraphNode[] {
  return points.map((point, id) => ({
    id,
    x: point.x,
    y: point.y,
    tx: point.x,
    ty: point.y,
    pluck: 0,
    grab: 0,
  }));
}

function crosses(points: readonly Point[], edges: readonly GraphEdge[]): boolean {
  return findIntersections(nodesFrom(points), edges).length > 0;
}

function scrambleOnCircle(
  count: number,
  edges: readonly GraphEdge[],
  rnd: () => number,
): { points: Point[]; crossings: number } {
  const order = Array.from({ length: count }, (_, index) => index);
  shuffleIds(order, rnd);
  const onRing = order.map((_, slot) => {
    const angle = -Math.PI / 2 + (slot / count) * Math.PI * 2 + (rnd() - 0.5) * 0.08;
    return { x: Math.cos(angle) * 0.92, y: Math.sin(angle) * 0.92 };
  });
  const placed: Point[] = Array.from({ length: count }, () => ({ x: 0, y: 0 }));
  order.forEach((id, slot) => {
    placed[id] = onRing[slot]!;
  });
  return { points: placed, crossings: crossingCount(placed, edges) };
}

export function planLevel(level: number, seed: number): LevelPlan | null {
  const figure = constellationForLevel(level);
  if (figure) {
    const rnd = mulberry32(seed ^ 0xc0ffee);
    const solved = figure.solved.map((point) => ({ x: point.x, y: point.y }));
    const edges = figure.edges.map((edge) => ({ a: edge.a, b: edge.b }));
    if (crosses(solved, edges)) return null;
    const minCross = Math.max(2, Math.min(5, Math.floor(solved.length / 2)));
    let tangled = tanglePoints(solved, edges, 0, minCross, rnd);
    if (!tangled || tangled.crossings < 1) {
      const fallback = scrambleOnCircle(solved.length, edges, rnd);
      if (fallback.crossings < 1) {
        // Wymuś krzyż: zamiana dwóch sąsiadów na okręgu.
        const again = scrambleOnCircle(solved.length, edges, rnd);
        tangled = { points: again.points, crossings: Math.max(1, again.crossings) };
      } else {
        tangled = fallback;
      }
    }
    return {
      solved,
      tangled: tangled.points,
      edges,
      crossings: tangled.crossings,
      constellationName: figure.reveal,
      constellationId: figure.id,
      isConstellation: true,
    };
  }

  const spec = specsForLevel(level);
  if (spec.nodes < 4) return null;

  const rnd = mulberry32(seed);
  const solved = sunflower(spec.nodes, rnd);
  const edges = minimumSpanningTree(solved);
  addPlanarEdges(solved, edges, spec.extraEdges, rnd);
  if (!ensureDisjointPair(solved, edges)) return null;
  if (crosses(solved, edges)) return null;

  const tangled = tanglePoints(solved, edges, spec.innerNodes, spec.minCrossings, rnd);
  if (!tangled) return null;

  return { solved, tangled: tangled.points, edges, crossings: tangled.crossings };
}

function scalePoint(point: Point, arena: Arena): Point {
  return {
    x: arena.cx + point.x * arena.radius * INSIDE,
    y: arena.cy + point.y * arena.radius * INSIDE,
  };
}

/**
 * Najmniejsza liczba przeciągnięć, po których układ da się rozplątać:
 * każdy ruch stawia jeden kryształ na jego rozwiązanym miejscu.
 * Mniej ruchów zostawia choć jedno przecięcie.
 */
export function movesToUntangle(
  solved: readonly Point[],
  tangled: readonly Point[],
  edges: readonly GraphEdge[],
): number {
  const count = tangled.length;
  if (count === 0 || crossingCount(tangled, edges) === 0) return 0;

  const involved: number[] = [];
  const groups: number[][] = [];
  const hits = findIntersections(nodesFrom(tangled), edges);
  const seen = new Set<number>();
  for (const hit of hits) {
    const first = edges[hit.edgeA];
    const second = edges[hit.edgeB];
    if (!first || !second) continue;
    const group = [first.a, first.b, second.a, second.b];
    groups.push(group);
    for (const id of group) {
      if (seen.has(id)) continue;
      seen.add(id);
      involved.push(id);
    }
  }
  if (involved.length === 0) return 0;

  let lower = involved.length;
  const masks = 1 << involved.length;
  for (let mask = 1; mask < masks; mask++) {
    let bits = 0;
    for (let index = 0; index < involved.length; index++) if (mask & (1 << index)) bits += 1;
    if (bits >= lower) continue;
    const picked = new Set<number>();
    for (let index = 0; index < involved.length; index++) {
      if (mask & (1 << index)) picked.add(involved[index]!);
    }
    if (groups.every((group) => group.some((id) => picked.has(id)))) lower = bits;
  }

  const placed: Point[] = tangled.map((point) => ({ x: point.x, y: point.y }));
  const parked = new Set<number>();
  let upper = 0;

  while (crossingCount(placed, edges) > 0 && upper < involved.length) {
    let bestId = -1;
    let bestCount = Number.POSITIVE_INFINITY;
    for (const id of involved) {
      if (parked.has(id)) continue;
      const home = solved[id];
      const current = placed[id];
      if (!home || !current) continue;
      placed[id] = home;
      const next = crossingCount(placed, edges);
      placed[id] = current;
      if (next < bestCount) {
        bestCount = next;
        bestId = id;
      }
    }
    if (bestId < 0) break;
    const home = solved[bestId];
    if (!home) break;
    placed[bestId] = home;
    parked.add(bestId);
    upper += 1;
  }

  if (upper === lower) return upper;

  const fresh = tangled.map((point) => ({ x: point.x, y: point.y }));
  for (let index = 0; index < fresh.length; index++) {
    const point = fresh[index];
    if (point) placed[index] = { x: point.x, y: point.y };
  }

  let best = upper;
  const deadline = Date.now() + (involved.length > 11 ? 48 : 180);
  const moved = new Set<number>();

  const improve = (moves: number): void => {
    if (moves >= best || Date.now() > deadline) return;
    const remaining = findIntersections(nodesFrom(placed), edges);
    if (remaining.length === 0) {
      best = moves;
      return;
    }
    const hit = remaining[0];
    const first = hit ? edges[hit.edgeA] : undefined;
    const second = hit ? edges[hit.edgeB] : undefined;
    if (!first || !second) return;
    const options = [first.a, first.b, second.a, second.b].filter((id) => !moved.has(id));
    for (const id of options) {
      const home = solved[id];
      const current = placed[id];
      if (!home || !current) continue;
      placed[id] = home;
      moved.add(id);
      improve(moves + 1);
      placed[id] = current;
      moved.delete(id);
      if (Date.now() > deadline) return;
    }
  };

  improve(0);
  return best;
}

function fallbackPlan(): LevelPlan {
  const solved: Point[] = [
    { x: 0, y: -0.62 },
    { x: 0.58, y: 0.36 },
    { x: -0.58, y: 0.36 },
    { x: 0, y: 0 },
  ];
  const edges: GraphEdge[] = [
    link(0, 1),
    link(1, 2),
    link(2, 0),
    link(3, 0),
    link(3, 1),
    link(3, 2),
  ];
  const tangled = [0, 1, 2, 3].map((index) => {
    const angle = -Math.PI / 2 + (index / 4) * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
  const crossings = crossingCount(tangled, edges);
  return { solved, tangled, edges, crossings };
}

function graphFromPlan(level: number, plan: LevelPlan, arena: Arena): Graph {
  const nodes = nodesFrom(plan.tangled.map((point) => scalePoint(point, arena)));
  const outline = plan.isConstellation
    ? plan.solved.map((point) => scalePoint(point, arena))
    : undefined;
  return {
    nodes,
    edges: plan.edges,
    arena,
    level,
    minimumMoves: movesToUntangle(plan.solved, plan.tangled, plan.edges),
    outline,
    constellationName: plan.constellationName,
    constellationId: plan.constellationId,
    isConstellation: plan.isConstellation === true,
  };
}

export function createLevel(
  level: number,
  width: number,
  height: number,
  chrome?: ArenaChrome,
): Graph {
  const arena = computeArena(width, height, chrome);
  const figure = constellationForLevel(level);
  const spec = specsForLevel(level);
  let best: LevelPlan | null = null;

  for (let attempt = 0; attempt < 48; attempt++) {
    const seed = Math.imul(Math.max(1, level), 10007) + attempt * 7919 + 42;
    const plan = planLevel(level, seed);
    if (!plan) continue;
    if (!best || plan.crossings > best.crossings) best = plan;
    const need = figure ? Math.max(2, Math.min(4, Math.floor(plan.solved.length / 2))) : spec.minCrossings;
    if (plan.crossings >= need) break;
  }

  if (!best && figure) {
    // Ostatnia deska: figura + okrągłe splątanie.
    best = planLevel(level, Math.imul(level, 99991) + 7);
  }

  return graphFromPlan(level, best ?? fallbackPlan(), arena);
}

/** Ten sam układ na obu urządzeniach w pojedynku. */
export function createLevelWithSeed(
  level: number,
  seed: number,
  width: number,
  height: number,
  chrome?: ArenaChrome,
): Graph {
  const arena = computeArena(width, height, chrome);
  const spec = specsForLevel(level);
  let best: LevelPlan | null = null;

  for (let attempt = 0; attempt < 32; attempt++) {
    const trySeed = seed + attempt * 7919;
    const plan = planLevel(level, trySeed);
    if (!plan) continue;
    if (!best || plan.crossings > best.crossings) best = plan;
    if (plan.crossings >= spec.minCrossings) break;
  }

  return graphFromPlan(level, best ?? fallbackPlan(), arena);
}

export function fitGraph(graph: Graph, width: number, height: number, chrome?: ArenaChrome): void {
  const next = computeArena(width, height, chrome);
  const previous = graph.arena;
  const scale = previous.radius > 0 ? next.radius / previous.radius : 1;

  for (const node of graph.nodes) {
    const dx = node.x - previous.cx;
    const dy = node.y - previous.cy;
    const tdx = node.tx - previous.cx;
    const tdy = node.ty - previous.cy;
    node.x = next.cx + dx * scale;
    node.y = next.cy + dy * scale;
    node.tx = next.cx + tdx * scale;
    node.ty = next.cy + tdy * scale;
  }

  if (graph.outline) {
    graph.outline = graph.outline.map((point) => ({
      x: next.cx + (point.x - previous.cx) * scale,
      y: next.cy + (point.y - previous.cy) * scale,
    }));
  }

  graph.arena = next;
}

export function stepNodes(
  nodes: readonly GraphNode[],
  dt: number,
  draggingId: number | null,
): void {
  const follow = 1 - Math.exp(-SPRING * dt);

  for (const node of nodes) {
    const previousX = node.x;
    const previousY = node.y;
    node.x += (node.tx - node.x) * follow;
    node.y += (node.ty - node.y) * follow;
    node.pluck *= Math.exp(-3.5 * dt);

    if (draggingId === node.id) {
      const travel = Math.hypot(node.x - previousX, node.y - previousY);
      if (travel > 0.7) node.pluck = Math.min(1, node.pluck + travel * 0.05);
    }

    const grabbed = draggingId === node.id ? 1 : 0;
    node.grab += (grabbed - node.grab) * (1 - Math.exp(-12 * dt));
  }
}

export function pickNode(nodes: readonly GraphNode[], x: number, y: number): number {
  let best = -1;
  let bestDistance = TOUCH_RADIUS;

  for (const node of nodes) {
    const distance = Math.hypot(node.x - x, node.y - y);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = node.id;
    }
  }

  return best;
}

export function clampToBoard(x: number, y: number, width: number, height: number): Point {
  const margin = 30;
  return {
    x: Math.min(Math.max(margin, x), Math.max(margin, width - margin)),
    y: Math.min(Math.max(margin, y), Math.max(margin, height - margin)),
  };
}

function separateFromOthers(
  nodes: readonly GraphNode[],
  id: number,
  x: number,
  y: number,
): Point {
  let px = x;
  let py = y;

  for (const other of nodes) {
    if (other.id === id) continue;
    const dx = px - other.x;
    const dy = py - other.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= MIN_DRAG_GAP) continue;
    if (distance <= 0.001) {
      px += MIN_DRAG_GAP;
      continue;
    }
    const push = (MIN_DRAG_GAP - distance) / distance;
    px += dx * push;
    py += dy * push;
  }

  return { x: px, y: py };
}

export function clampToArena(x: number, y: number, arena: Arena): Point {
  const dx = x - arena.cx;
  const dy = y - arena.cy;
  const maxRadius = Math.max(32, arena.radius - CRYSTAL_PAD);
  const distance = Math.hypot(dx, dy);
  if (distance <= maxRadius || distance === 0) return { x, y };
  const scale = maxRadius / distance;
  return { x: arena.cx + dx * scale, y: arena.cy + dy * scale };
}

export function placeDragTarget(
  nodes: readonly GraphNode[],
  id: number,
  x: number,
  y: number,
  arena: Arena,
): Point {
  let point = clampToArena(x, y, arena);
  point = separateFromOthers(nodes, id, point.x, point.y);
  point = clampToArena(point.x, point.y, arena);
  point = separateFromOthers(nodes, id, point.x, point.y);
  return clampToArena(point.x, point.y, arena);
}

export function isDegenerate(nodes: readonly GraphNode[]): boolean {
  for (let i = 0; i < nodes.length; i++) {
    const left = nodes[i];
    if (!left) continue;
    for (let j = i + 1; j < nodes.length; j++) {
      const right = nodes[j];
      if (!right) continue;
      if (Math.hypot(left.x - right.x, left.y - right.y) < DEGENERATE_GAP) return true;
    }
  }
  return false;
}
