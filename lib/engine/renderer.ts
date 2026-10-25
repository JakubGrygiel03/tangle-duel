import type { Graph, GraphNode } from "./graph";
import type { IntersectionHit } from "./intersections";
import { getTheme, type VisualTheme } from "./themes";

export type DrawModel = {
  graph: Graph;
  hits: readonly IntersectionHit[];
  time: number;
  bloom: number;
  width: number;
  height: number;
  theme?: VisualTheme;
};

type Mote = {
  baseX: number;
  baseY: number;
  radius: number;
  alpha: number;
  speed: number;
  phase: number;
  amber: boolean;
};

export class BoardRenderer {
  private motes: Mote[] = [];
  private theme: VisualTheme = getTheme("dusk");

  setTheme(theme: VisualTheme): void {
    this.theme = theme;
  }

  draw(ctx: CanvasRenderingContext2D, model: DrawModel): void {
    const { graph, hits, time, bloom, width, height } = model;
    if (model.theme) this.theme = model.theme;
    this.ensureMotes();

    this.drawBackground(ctx, width, height, time);
    this.drawMotes(ctx, width, height, time);
    this.drawArena(ctx, graph);
    this.drawStrings(ctx, graph, hits, time, bloom);
    this.drawSparks(ctx, hits, time);
    this.drawCrystals(ctx, graph, hits, time, bloom);
    this.drawBloom(ctx, graph, bloom, width, height);
  }

  private ensureMotes(): void {
    if (this.motes.length > 0) return;
    for (let index = 0; index < 36; index++) {
      this.motes.push({
        baseX: Math.random() * 1200,
        baseY: Math.random() * 2000,
        radius: 0.6 + Math.random() * 1.5,
        alpha: 0.12 + Math.random() * 0.32,
        speed: 6 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        amber: index % 9 === 0,
      });
    }
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
  ): void {
    const theme = this.theme;
    ctx.fillStyle = theme.ink;
    ctx.fillRect(0, 0, width, height);

    const driftX = Math.sin(time * 0.13) * width * 0.06;
    const driftY = Math.cos(time * 0.11) * height * 0.04;

    const dusk = ctx.createRadialGradient(
      width * 0.5 + driftX,
      height * 0.4 + driftY,
      16,
      width * 0.5,
      height * 0.48,
      Math.max(width, height) * 0.72,
    );
    dusk.addColorStop(0, theme.sky.a);
    dusk.addColorStop(0.42, theme.sky.b);
    dusk.addColorStop(1, theme.sky.c);
    ctx.fillStyle = dusk;
    ctx.fillRect(0, 0, width, height);

    const tide = ctx.createRadialGradient(
      width * 0.18 - driftX,
      height * 0.78,
      8,
      width * 0.28,
      height * 0.72,
      height * 0.48,
    );
    tide.addColorStop(0, theme.tide.a);
    tide.addColorStop(1, theme.tide.b);
    ctx.fillStyle = tide;
    ctx.fillRect(0, 0, width, height);

    const ember = ctx.createRadialGradient(
      width * 0.86 + driftX * 0.4,
      height * 0.16,
      8,
      width * 0.78,
      height * 0.12,
      width * 0.55,
    );
    ember.addColorStop(0, theme.ember.a);
    ember.addColorStop(1, theme.ember.b);
    ctx.fillStyle = ember;
    ctx.fillRect(0, 0, width, height);

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.28,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72,
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.48)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  private drawMotes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
  ): void {
    const theme = this.theme;
    ctx.shadowBlur = 0;
    for (const mote of this.motes) {
      const x =
        ((mote.baseX + Math.sin(time * 0.35 + mote.phase) * 18) % width + width) %
        width;
      const y = ((mote.baseY - time * mote.speed) % height + height) % height;
      ctx.beginPath();
      ctx.fillStyle = mote.amber
        ? `rgba(${theme.moteWarm}, ${mote.alpha})`
        : `rgba(${theme.moteCool}, ${mote.alpha})`;
      ctx.arc(x, y, mote.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawArena(ctx: CanvasRenderingContext2D, graph: Graph): void {
    const theme = this.theme;
    const { cx, cy, radius } = graph.arena;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.arenaFill;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = theme.arenaStroke;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.08, 0, Math.PI * 2);
    ctx.strokeStyle = theme.arenaStroke.replace(/[\d.]+\)$/, "0.06)");
    ctx.stroke();
  }

  private drawStrings(
    ctx: CanvasRenderingContext2D,
    graph: Graph,
    hits: readonly IntersectionHit[],
    time: number,
    bloom: number,
  ): void {
    const crossed = new Set<number>();
    for (const hit of hits) {
      crossed.add(hit.edgeA);
      crossed.add(hit.edgeB);
    }

    const free: number[] = [];
    const tangled: number[] = [];
    graph.edges.forEach((_, index) => {
      if (crossed.has(index)) tangled.push(index);
      else free.push(index);
    });

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const index of free) this.strokeString(ctx, graph, index, false, time, bloom);
    for (const index of tangled) this.strokeString(ctx, graph, index, true, time, bloom);
    ctx.shadowBlur = 0;
  }

  private strokeString(
    ctx: CanvasRenderingContext2D,
    graph: Graph,
    index: number,
    crossed: boolean,
    time: number,
    bloom: number,
  ): void {
    const theme = this.theme;
    const edge = graph.edges[index];
    if (!edge) return;
    const a = graph.nodes[edge.a];
    const b = graph.nodes[edge.b];
    if (!a || !b) return;

    this.traceString(ctx, a, b, time);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (crossed) {
      ctx.shadowColor = theme.tangledGlow;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = theme.tangled;
      ctx.lineWidth = 2.35;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = theme.tangledCore;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      return;
    }

    ctx.shadowColor = theme.freeGlow;
    ctx.shadowBlur = 16 + bloom * 18;
    ctx.strokeStyle = theme.free;
    ctx.lineWidth = 1.85;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = theme.freeCore;
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }

  private traceString(
    ctx: CanvasRenderingContext2D,
    a: GraphNode,
    b: GraphNode,
    time: number,
  ): void {
    const amplitude = (a.pluck + b.pluck) * 2.2;
    const phase = time * 26 + a.id * 1.7;
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / length;
    const ny = (b.x - a.x) / length;
    const steps = 14;

    ctx.beginPath();
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const envelope = Math.sin(t * Math.PI);
      const wave = Math.sin(t * Math.PI * 2 + phase) * envelope * amplitude;
      const x = a.x + (b.x - a.x) * t + nx * wave;
      const y = a.y + (b.y - a.y) * t + ny * wave;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }

  private drawSparks(
    ctx: CanvasRenderingContext2D,
    hits: readonly IntersectionHit[],
    time: number,
  ): void {
    const theme = this.theme;
    hits.forEach((hit, index) => {
      const pulse = 0.55 + 0.45 * Math.sin(time * 6.2 + index * 1.4);
      ctx.save();
      ctx.translate(hit.point.x, hit.point.y);
      ctx.shadowColor = theme.tangledGlow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = theme.tangledCore.replace(/[\d.]+\)$/, `${0.35 + pulse * 0.6})`);
      ctx.beginPath();
      ctx.arc(0, 0, 2.2 + pulse * 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = theme.spark;
      ctx.globalAlpha = 0.45 + pulse * 0.45;
      ctx.lineWidth = 1;
      const arm = 5 + pulse * 6;
      ctx.beginPath();
      ctx.moveTo(-arm, 0);
      ctx.lineTo(arm, 0);
      ctx.moveTo(0, -arm);
      ctx.lineTo(0, arm);
      ctx.stroke();
      ctx.restore();
    });
  }

  private drawCrystals(
    ctx: CanvasRenderingContext2D,
    graph: Graph,
    hits: readonly IntersectionHit[],
    time: number,
    bloom: number,
  ): void {
    const warm = new Array<boolean>(graph.nodes.length).fill(false);
    if (bloom < 0.35) {
      for (const hit of hits) {
        const first = graph.edges[hit.edgeA];
        const second = graph.edges[hit.edgeB];
        if (first) {
          warm[first.a] = true;
          warm[first.b] = true;
        }
        if (second) {
          warm[second.a] = true;
          warm[second.b] = true;
        }
      }
    }

    for (const node of graph.nodes) {
      this.drawCrystal(ctx, node, warm[node.id] ?? false, time, bloom);
    }
    ctx.shadowBlur = 0;
  }

  private drawCrystal(
    ctx: CanvasRenderingContext2D,
    node: GraphNode,
    warm: boolean,
    time: number,
    bloom: number,
  ): void {
    const theme = this.theme;
    const radius = 8 + node.grab * 2.6 + bloom * 1.4;

    if (node.grab > 0.04) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = theme.arenaStroke.replace(/[\d.]+\)$/, `${0.16 * node.grab})`);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.rotate(Math.PI / 4 + Math.sin(time * 0.7 + node.id) * 0.06);
    ctx.shadowColor = warm ? theme.tangledGlow : theme.freeGlow;
    ctx.shadowBlur = 12 + node.grab * 12;

    const facet = ctx.createLinearGradient(-radius, -radius, radius, radius);
    const palette = warm ? theme.crystalWarm : theme.crystalCool;
    facet.addColorStop(0, palette[0]);
    facet.addColorStop(0.5, palette[1]);
    facet.addColorStop(1, palette[2]);

    ctx.fillStyle = facet;
    this.diamond(ctx, radius);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    this.diamond(ctx, radius * 0.36);
    ctx.fill();
    ctx.restore();
  }

  private diamond(ctx: CanvasRenderingContext2D, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius, 0);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius, 0);
    ctx.closePath();
  }

  private drawBloom(
    ctx: CanvasRenderingContext2D,
    graph: Graph,
    bloom: number,
    width: number,
    height: number,
  ): void {
    if (bloom <= 0) return;
    const theme = this.theme;
    const eased = 1 - (1 - bloom) ** 2;
    const alpha = Math.sin(Math.min(1, bloom) * Math.PI);
    const { cx, cy } = graph.arena;
    const radius = eased * Math.hypot(width, height) * 0.62;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(4, radius), 0, Math.PI * 2);
    ctx.strokeStyle = theme.bloomRing.replace(/[\d.]+\)$/, `${0.8 * alpha})`);
    ctx.lineWidth = 10 * (1 - bloom) + 1.5;
    ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
    ctx.shadowBlur = 28;
    ctx.stroke();

    const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.65);
    flash.addColorStop(0, `rgba(${theme.bloomFlash}, ${0.28 * alpha})`);
    flash.addColorStop(1, `rgba(${theme.bloomFlash}, 0)`);
    ctx.shadowBlur = 0;
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
