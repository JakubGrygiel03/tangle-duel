import type { GraphEdge, GraphNode, Point } from "./graph";

export type IntersectionHit = {
  edgeA: number;
  edgeB: number;
  point: Point;
};

/** Znak orientacji trójki punktów. Dodatni = skręt w lewo (CCW). */
export function orient(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function span(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Punkt leży we wnętrzu odcinka, nie na jego końcach.
 * Wspólny wierzchołek dwóch krawędzi nie jest więc przecięciem.
 */
function pointInsideSegment(a: Point, b: Point, point: Point): boolean {
  const length = span(a, b);
  if (length <= 1e-12) return false;
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const area = Math.abs(abx * apy - aby * apx);
  if (area > 1e-8 * Math.max(1, length)) return false;
  const dot = apx * abx + apy * aby;
  const margin = 1e-7 * length;
  return dot > margin && dot < length * length - margin;
}

function overlapPoint(a: Point, b: Point, c: Point, d: Point): Point | null {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;
  if (lengthSquared <= 1e-18) return null;
  const project = (point: Point) => ((point.x - a.x) * abx + (point.y - a.y) * aby) / lengthSquared;
  let start = project(c);
  let end = project(d);
  if (start > end) {
    const swap = start;
    start = end;
    end = swap;
  }
  const low = Math.max(0, start);
  const high = Math.min(1, end);
  if (high - low <= 1e-7) return null;
  const t = (low + high) / 2;
  return { x: a.x + abx * t, y: a.y + aby * t };
}

/**
 * Przecięcie dwóch odcinków.
 * Najpierw ścisły test CCW (końce leżą po przeciwnych stronach).
 * Potem nakładanie współliniowe i punkt leżący we wnętrzu drugiego odcinka.
 */
export function segmentIntersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);

  if (o1 * o2 < 0 && o3 * o4 < 0) {
    const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
    if (denominator === 0) return null;
    const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator;
    return {
      x: a.x + t * (b.x - a.x),
      y: a.y + t * (b.y - a.y),
    };
  }

  if (pointInsideSegment(a, b, c)) return { x: c.x, y: c.y };
  if (pointInsideSegment(a, b, d)) return { x: d.x, y: d.y };
  if (pointInsideSegment(c, d, a)) return { x: a.x, y: a.y };
  if (pointInsideSegment(c, d, b)) return { x: b.x, y: b.y };

  const limit = 1e-9 * Math.max(1, span(a, b) * span(a, b), span(c, d) * span(c, d));
  if (
    Math.abs(o1) <= limit &&
    Math.abs(o2) <= limit &&
    Math.abs(o3) <= limit &&
    Math.abs(o4) <= limit
  ) {
    return overlapPoint(a, b, c, d);
  }

  return null;
}

export function edgesShareVertex(left: GraphEdge, right: GraphEdge): boolean {
  return (
    left.a === right.a ||
    left.a === right.b ||
    left.b === right.a ||
    left.b === right.b
  );
}

export function findIntersections(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): IntersectionHit[] {
  const hits: IntersectionHit[] = [];

  for (let i = 0; i < edges.length; i++) {
    const first = edges[i];
    if (!first) continue;
    const a = nodes[first.a];
    const b = nodes[first.b];
    if (!a || !b) continue;

    for (let j = i + 1; j < edges.length; j++) {
      const second = edges[j];
      if (!second || edgesShareVertex(first, second)) continue;
      const c = nodes[second.a];
      const d = nodes[second.b];
      if (!c || !d) continue;

      const point = segmentIntersection(a, b, c, d);
      if (point) hits.push({ edgeA: i, edgeB: j, point });
    }
  }

  return hits;
}

/**
 * Dolne ograniczenie liczby ruchów: każde rozłączne przecięcie
 * wymaga osobnego przeciągnięcia, bo nie dzieli wierzchołka z poprzednim.
 */
export function minimumMoveCount(
  edges: readonly GraphEdge[],
  hits: readonly IntersectionHit[],
): number {
  if (hits.length === 0) return 0;
  const used = new Set<number>();
  let moves = 0;

  for (const hit of hits) {
    const first = edges[hit.edgeA];
    const second = edges[hit.edgeB];
    if (!first || !second) continue;
    const vertices = [first.a, first.b, second.a, second.b];
    if (vertices.some((id) => used.has(id))) continue;
    for (const id of vertices) used.add(id);
    moves += 1;
  }

  return Math.max(1, moves);
}
