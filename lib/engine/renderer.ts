import type { CrystalShapeId, TrailId } from "./economy";
import type { Graph, GraphNode } from "./graph";
import type { IntersectionHit } from "./intersections";
import { getTheme, type VisualTheme } from "./themes";

export type TrailMote = {
  x: number;
  y: number;
  life: number;
  vx: number;
  vy: number;
  spin: number;
};

export type DrawModel = {
  graph: Graph;
  hits: readonly IntersectionHit[];
  time: number;
  bloom: number;
  width: number;
  height: number;
  theme?: VisualTheme;
  crystalShape?: CrystalShapeId;
  /** Tryb Echo: struny widoczne tylko podczas sonaru. */
  echoReveal?: number;
  /** Ślad za przeciąganym węzłem. */
  trail?: readonly TrailMote[];
  trailStyle?: TrailId;
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
  private crystalShape: CrystalShapeId = "diamond";

  setTheme(theme: VisualTheme): void {
    this.theme = theme;
  }

  draw(ctx: CanvasRenderingContext2D, model: DrawModel): void {
    const { graph, hits, time, bloom, width, height } = model;
    if (model.theme) this.theme = model.theme;
    if (model.crystalShape) this.crystalShape = model.crystalShape;
    this.ensureMotes();

    this.drawBackground(ctx, width, height, time);
    this.drawMotes(ctx, width, height, time);
    this.drawArena(ctx, graph);
    this.drawOutline(ctx, graph, time, bloom);
    const reveal = model.echoReveal;
    const stringsVisible = reveal === undefined || reveal > 0.02;
    if (stringsVisible) {
      const prevAlpha = ctx.globalAlpha;
      if (reveal !== undefined) ctx.globalAlpha = Math.min(1, reveal);
      this.drawStrings(ctx, graph, hits, time, bloom);
      this.drawSparks(ctx, hits, time);
      ctx.globalAlpha = prevAlpha;
    }
    if (model.trail && model.trail.length > 0) {
      this.drawTrail(ctx, model.trail, model.trailStyle ?? "dust", time);
    }
    this.drawCrystals(ctx, graph, hits, time, bloom);
    this.drawBloom(ctx, graph, bloom, width, height);
  }

  private drawOutline(
    ctx: CanvasRenderingContext2D,
    graph: Graph,
    time: number,
    bloom: number,
  ): void {
    const outline = graph.outline;
    if (!outline || outline.length < 2) return;
    const theme = this.theme;
    const pulse = 0.18 + 0.1 * Math.sin(time * 1.35);
    const alpha = Math.min(0.55, pulse + bloom * 0.4);

    ctx.save();
    ctx.beginPath();
    for (const edge of graph.edges) {
      const a = outline[edge.a];
      const b = outline[edge.b];
      if (!a || !b) continue;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.strokeStyle = theme.freeGlow.replace(/[\d.]+\)$/, `${alpha * 0.55})`);
    ctx.lineWidth = 1.35;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < outline.length; i++) {
      const point = outline[i];
      if (!point) continue;
      const well = 10 + 1.5 * Math.sin(time * 2.1 + i);
      ctx.beginPath();
      ctx.arc(point.x, point.y, well, 0, Math.PI * 2);
      ctx.strokeStyle = theme.freeGlow.replace(/[\d.]+\)$/, `${alpha * 0.35})`);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = theme.freeCore.replace(/[\d.]+\)$/, `${0.35 + alpha})`);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTrail(
    ctx: CanvasRenderingContext2D,
    trail: readonly TrailMote[],
    style: TrailId,
    time: number,
  ): void {
    if (style === "comet") {
      this.drawCometTrail(ctx, trail);
      return;
    }
    if (style === "aurora") {
      this.drawAuroraTrail(ctx, trail, time);
      return;
    }
    if (style === "ribbon") {
      this.drawRibbonTrail(ctx, trail, time);
      return;
    }

    const theme = this.theme;
    for (const mote of trail) {
      if (mote.life <= 0) continue;
      const life = mote.life;
      if (style === "ember") {
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, 1.2 + life * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${theme.moteWarm}, ${0.62 * life})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mote.x + mote.vx * 0.15, mote.y + mote.vy * 0.15, 0.7 + life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 170, ${0.35 * life})`;
        ctx.fill();
        continue;
      }
      if (style === "spark") {
        const len = 3 + life * 7;
        const ang = mote.spin + time * 4;
        ctx.save();
        ctx.translate(mote.x, mote.y);
        ctx.rotate(ang);
        ctx.strokeStyle = `rgba(${theme.moteCool}, ${0.75 * life})`;
        ctx.lineWidth = 1.1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-len, 0);
        ctx.lineTo(len, 0);
        ctx.moveTo(0, -len * 0.55);
        ctx.lineTo(0, len * 0.55);
        ctx.stroke();
        ctx.restore();
        continue;
      }
      // dust — domyślny pył
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, 1.6 + life * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${theme.moteCool}, ${0.55 * life})`;
      ctx.fill();
    }
  }

  /** Ostry ogon komety: jasna głowa + zwężająca się smuga wzdłuż toru. */
  private drawCometTrail(ctx: CanvasRenderingContext2D, trail: readonly TrailMote[]): void {
    if (trail.length === 0) return;
    const theme = this.theme;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1]!;
      const b = trail[i]!;
      const life = Math.min(a.life, b.life);
      if (life <= 0.02) continue;
      const age = 1 - life;
      // Stare odcinki cieńsze — klasyczny ogon.
      const width = Math.max(0.6, (5.5 - age * 4.2) * life);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(255, 248, 230, ${0.18 + 0.55 * life})`;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * life})`;
      ctx.lineWidth = width * 0.35;
      ctx.stroke();
    }
    const head = trail[trail.length - 1]!;
    if (head.life > 0.05) {
      const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 10);
      glow.addColorStop(0, `rgba(255, 255, 255, ${0.85 * head.life})`);
      glow.addColorStop(0.45, `rgba(${theme.moteWarm}, ${0.45 * head.life})`);
      glow.addColorStop(1, `rgba(${theme.moteWarm}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * head.life})`;
      ctx.fill();
    }
    ctx.restore();
  }

  /** Zorza: szerokie, falujące plamy w dwóch barwach — bez twardej linii. */
  private drawAuroraTrail(
    ctx: CanvasRenderingContext2D,
    trail: readonly TrailMote[],
    time: number,
  ): void {
    const theme = this.theme;
    ctx.save();
    for (let i = 0; i < trail.length; i++) {
      const mote = trail[i]!;
      if (mote.life <= 0.02) continue;
      const wave = Math.sin(time * 2.4 + mote.spin + i * 0.35);
      const ox = Math.cos(mote.spin) * wave * 7;
      const oy = Math.sin(mote.spin) * wave * 7;
      const x = mote.x + ox;
      const y = mote.y + oy;
      const rx = 6 + mote.life * 14;
      const ry = 2.5 + mote.life * 5.5;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, mote.spin + wave * 0.4, 0, Math.PI * 2);
      ctx.fillStyle =
        i % 2 === 0
          ? `rgba(${theme.moteCool}, ${0.16 * mote.life})`
          : `rgba(${theme.moteWarm}, ${0.12 * mote.life})`;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y, rx * 0.45, ry * 0.55, mote.spin, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210, 255, 245, ${0.14 * mote.life})`;
      ctx.fill();
    }
    ctx.restore();
  }

  /** Wstęga: skręcona taśma o zmiennej szerokości i ostrzejszej krawędzi. */
  private drawRibbonTrail(
    ctx: CanvasRenderingContext2D,
    trail: readonly TrailMote[],
    time: number,
  ): void {
    if (trail.length < 2) return;
    const theme = this.theme;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1]!;
      const b = trail[i]!;
      const life = Math.min(a.life, b.life);
      if (life <= 0.02) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const twist = Math.sin(time * 3.2 + a.spin + i * 0.55);
      const half = (2.2 + life * 5.5) * (0.35 + Math.abs(twist) * 0.9);
      const ax1 = a.x + nx * half;
      const ay1 = a.y + ny * half;
      const ax2 = a.x - nx * half;
      const ay2 = a.y - ny * half;
      const bx1 = b.x + nx * half * 0.85;
      const by1 = b.y + ny * half * 0.85;
      const bx2 = b.x - nx * half * 0.85;
      const by2 = b.y - ny * half * 0.85;

      ctx.beginPath();
      ctx.moveTo(ax1, ay1);
      ctx.lineTo(bx1, by1);
      ctx.lineTo(bx2, by2);
      ctx.lineTo(ax2, ay2);
      ctx.closePath();
      ctx.fillStyle =
        twist >= 0
          ? `rgba(${theme.moteCool}, ${0.28 * life})`
          : `rgba(${theme.moteWarm}, ${0.22 * life})`;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 * life})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    ctx.restore();
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
    const shape = this.crystalShape;

    if (node.grab > 0.04) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = theme.arenaStroke.replace(/[\d.]+\)$/, `${0.16 * node.grab})`);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(node.x, node.y);
    const spin =
      shape === "ring"
        ? time * 0.9 + node.id
        : Math.PI / 4 + Math.sin(time * 0.7 + node.id) * 0.06;
    ctx.rotate(spin);
    ctx.shadowColor = warm ? theme.tangledGlow : theme.freeGlow;
    ctx.shadowBlur = 12 + node.grab * 12;

    const facet = ctx.createLinearGradient(-radius, -radius, radius, radius);
    const palette = warm ? theme.crystalWarm : theme.crystalCool;
    facet.addColorStop(0, palette[0]);
    facet.addColorStop(0.5, palette[1]);
    facet.addColorStop(1, palette[2]);

    ctx.fillStyle = facet;
    this.traceShape(ctx, shape, radius);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (shape === "ring") {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
      this.traceShape(ctx, shape, radius * 0.36);
      ctx.fill();
    }
    ctx.restore();
  }

  private traceShape(ctx: CanvasRenderingContext2D, shape: CrystalShapeId, radius: number): void {
    if (shape === "hex") {
      this.polygon(ctx, radius, 6, Math.PI / 6);
      return;
    }
    if (shape === "star") {
      this.star(ctx, radius, 5);
      return;
    }
    if (shape === "rune") {
      this.polygon(ctx, radius, 3, -Math.PI / 2);
      return;
    }
    if (shape === "ring") {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      return;
    }
    this.diamond(ctx, radius);
  }

  private diamond(ctx: CanvasRenderingContext2D, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius, 0);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius, 0);
    ctx.closePath();
  }

  private polygon(
    ctx: CanvasRenderingContext2D,
    radius: number,
    sides: number,
    offset: number,
  ): void {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = offset + (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  private star(ctx: CanvasRenderingContext2D, radius: number, points: number): void {
    const inner = radius * 0.42;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : inner;
      const angle = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
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
