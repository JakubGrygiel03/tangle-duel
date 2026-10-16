import type { GraphEdge, GraphNode, Point } from "./graph";

export type IntersectionHit = {
  edgeA: number;
  edgeB: number;
  point: Point;
};

const EPSILON = 1e-8;

/** Znak orientacji trójki punktów. Dodatni = skręt w lewo (CCW). */
export function orient(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function strictlyOpposite(left: number, right: number): boolean {
  if (Math.abs(left) <= EPSILON || Math.abs(right) <= EPSILON) return false;
  return left > 0 !== right > 0;
}

/**
 * Właściwe przecięcie dwóch odcinków. Dotknięcie końcem, styczność
 * i nakładanie współliniowe nie liczą się jako przecięcie.
 */
export function segmentIntersection(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
): Point | null {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);

  if (!strictlyOpposite(o1, o2) || !strictlyOpposite(o3, o4)) return null;

  const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (Math.abs(denominator) <= EPSILON) return null;

  const t =
    ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator;
  if (t <= EPSILON || t >= 1 - EPSILON) return null;

  return {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
  };
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
