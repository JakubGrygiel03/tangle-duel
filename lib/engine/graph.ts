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

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  arena: Arena;
  level: number;
};

export type LevelPlan = {
  solved: Point[];
  tangled: Point[];
  edges: GraphEdge[];
};

/** Średnica celu dotyku. Wizualny kryształ jest mniejszy. */
export const TOUCH_RADIUS = 44;

const MIN_DRAG_GAP = 22;
const DEGENERATE_GAP = 12;
const SPRING = 22;

export function specsForLevel(level: number): { nodes: number; extraEdges: number } {
  const safe = Math.max(1, Math.floor(level));
  const nodes = Math.min(12, 4 + safe);
  const extraEdges = Math.min(nodes, Math.max(2, Math.round(safe * 1.1)));
  return { nodes, extraEdges };
}

export function computeArena(width: number, height: number): Arena {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  return {
    cx: w / 2,
    cy: h * 0.53,
    radius: Math.max(72, Math.min(w * 0.36, h * 0.28)),
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

function relaxFreePoints(points: Point[], locked: ReadonlySet<number>): void {
  const minDistance = 0.24;

  for (let pass = 0; pass < 10; pass++) {
    for (let i = 0; i < points.length; i++) {
      if (locked.has(i)) continue;
      const point = points[i];
      if (!point) continue;

      for (let j = 0; j < points.length; j++) {
        if (i === j) continue;
        const other = points[j];
        if (!other) continue;
        const dx = point.x - other.x;
        const dy = point.y - other.y;
        const distance = Math.hypot(dx, dy) || 0.0001;
        if (distance >= minDistance) continue;
        const push = ((minDistance - distance) / distance) * 0.65;
        point.x += dx * push;
        point.y += dy * push;
      }

      const radius = Math.hypot(point.x, point.y) || 0.0001;
      if (radius > 0.86) {
        point.x = (point.x / radius) * 0.86;
        point.y = (point.y / radius) * 0.86;
      }
    }
  }
}

function tanglePoints(
  solved: readonly Point[],
  edges: readonly GraphEdge[],
  rnd: () => number,
): Point[] | null {
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
  for (let index = rest.length - 1; index > 0; index--) {
    const swap = Math.floor(rnd() * (index + 1));
    const current = rest[index];
    const other = rest[swap];
    if (current === undefined || other === undefined) continue;
    rest[index] = other;
    rest[swap] = current;
  }

  let cursor = 0;
  for (let slot = 0; slot < count; slot++) {
    if (order[slot] >= 0) continue;
    const id = rest[cursor];
    if (id === undefined) return null;
    order[slot] = id;
    cursor += 1;
  }

  const points: Point[] = new Array(count);
  const locked = new Set(lockedIds);

  for (let slot = 0; slot < count; slot++) {
    const id = order[slot];
    if (id === undefined || id < 0) return null;
    const angle = -Math.PI / 2 + (slot / count) * Math.PI * 2;
    const radius = locked.has(id) ? 1 : 0.56 + rnd() * 0.26;
    points[id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }

  if (points.some((point) => !point)) return null;
  relaxFreePoints(points, locked);
  return points;
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

export function planLevel(level: number, seed: number): LevelPlan | null {
  const { nodes, extraEdges } = specsForLevel(level);
  if (nodes < 4) return null;

  const rnd = mulberry32(seed);
  const solved = sunflower(nodes, rnd);
  const edges = minimumSpanningTree(solved);
  addPlanarEdges(solved, edges, extraEdges, rnd);
  if (!ensureDisjointPair(solved, edges)) return null;
  if (crosses(solved, edges)) return null;

  const tangled = tanglePoints(solved, edges, rnd);
  if (!tangled || !crosses(tangled, edges)) return null;

  return { solved, tangled, edges };
}

function scalePoint(point: Point, arena: Arena): Point {
  return {
    x: arena.cx + point.x * arena.radius,
    y: arena.cy + point.y * arena.radius,
  };
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
  return { solved, tangled, edges };
}

export function createLevel(level: number, width: number, height: number): Graph {
  const arena = computeArena(width, height);
  let plan: LevelPlan | null = null;

  for (let attempt = 0; attempt < 16; attempt++) {
    const seed = Math.imul(Math.max(1, level), 10007) + attempt * 7919 + 42;
    plan = planLevel(level, seed);
    if (plan) break;
  }

  const ready = plan ?? fallbackPlan();
  const nodes = nodesFrom(ready.tangled.map((point) => scalePoint(point, arena)));

  return {
    nodes,
    edges: ready.edges,
    arena,
    level,
  };
}

export function fitGraph(graph: Graph, width: number, height: number): void {
  const next = computeArena(width, height);
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

export function placeDragTarget(
  nodes: readonly GraphNode[],
  id: number,
  x: number,
  y: number,
  width: number,
  height: number,
): Point {
  let point = clampToBoard(x, y, width, height);
  point = separateFromOthers(nodes, id, point.x, point.y);
  point = clampToBoard(point.x, point.y, width, height);
  point = separateFromOthers(nodes, id, point.x, point.y);
  return clampToBoard(point.x, point.y, width, height);
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
