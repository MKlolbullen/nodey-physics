import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { type Chart, searchChart, type HitIndex, type Kind } from "@/graph/data";
import { ALPHA_MIN, createSim, reheat, step, type Sim, type SimNode } from "@/graph/simulate";

export type GraphPhase = "live" | "settled" | "frozen";

export type ForceGraphHandle = {
  reheat: () => void;
  fitAll: () => void;
  fitIds: (ids: string[]) => void;
  focus: (id: string) => void;
};

type Props = {
  chart: Chart;
  query: string;
  selectedId: string | null;
  frozen: boolean;
  onSelect: (id: string | null) => void;
  onPhase: (phase: GraphPhase) => void;
};

type Cam = { x: number; y: number; k: number };

type Palette = {
  ink: string;
  line: string;
  bone: string;
  mist: string;
  brass: string;
  sage: string;
  clay: string;
};

const FALLBACK: Palette = {
  ink: "#0c1210",
  line: "#2c3b33",
  bone: "#e6efe6",
  mist: "#93a399",
  brass: "#e0a84a",
  sage: "#7eae92",
  clay: "#d08462",
};

type Box = { x: number; y: number; w: number; h: number };

type ChartState = {
  chart: Chart;
  sim: Sim;
  byId: Map<string, SimNode>;
  cam: Cam;
  anim: { from: Cam; to: Cam; start: number; dur: number } | null;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  pal: Palette;
  w: number;
  h: number;
  dpr: number;
  query: string;
  queryKey: string;
  hits: HitIndex | null;
  selectedId: string | null;
  hoverId: string | null;
  frozenProp: boolean;
  phase: GraphPhase;
  raf: number;
  alive: boolean;
  ready: boolean;
  didFit: boolean;
  reduce: boolean;
  drag: SimNode | null;
  panning: boolean;
  down: { x: number; y: number; moved: boolean; nodeId: string | null } | null;
  lastPan: { x: number; y: number } | null;
  pointers: Map<number, { x: number; y: number }>;
  pinch: { dist: number; k: number; wx: number; wy: number } | null;
  onSelect: (id: string | null) => void;
  onPhase: (phase: GraphPhase) => void;
};

const K_MIN = 0.28;
const K_MAX = 2.8;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ease(t: number) {
  return 1 - (1 - t) ** 3;
}

function kindColor(kind: Kind, pal: Palette) {
  if (kind === "post" || kind === "net") return pal.brass;
  if (kind === "craft" || kind === "host") return pal.sage;
  if (kind === "person" || kind === "soft") return pal.clay;
  if (kind === "file") return pal.bone;
  return pal.bone;
}

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#") && color.length === 7) {
    const n = Number.parseInt(color.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const pick = (name: keyof Palette) => css.getPropertyValue(`--color-${name}`).trim() || FALLBACK[name];
  return {
    ink: pick("ink"),
    line: pick("line"),
    bone: pick("bone"),
    mist: pick("mist"),
    brass: pick("brass"),
    sage: pick("sage"),
    clay: pick("clay"),
  };
}

function createChartState(chart: Chart): ChartState {
  const sim = createSim(chart);
  return {
    chart,
    sim,
    byId: new Map(sim.nodes.map((n) => [n.id, n])),
    cam: { x: 0, y: 0, k: 1 },
    anim: null,
    canvas: null,
    ctx: null,
    pal: FALLBACK,
    w: 1,
    h: 1,
    dpr: 1,
    query: "",
    queryKey: "\0",
    hits: null,
    selectedId: null,
    hoverId: null,
    frozenProp: false,
    phase: "live",
    raf: 0,
    alive: true,
    ready: false,
    didFit: false,
    reduce: false,
    drag: null,
    panning: false,
    down: null,
    lastPan: null,
    pointers: new Map(),
    pinch: null,
    onSelect: () => {},
    onPhase: () => {},
  };
}

function localPoint(canvas: HTMLCanvasElement, event: { clientX: number; clientY: number }) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function hitNode(st: ChartState, x: number, y: number): SimNode | null {
  const wx = (x - st.cam.x) / st.cam.k;
  const wy = (y - st.cam.y) / st.cam.k;
  let best: SimNode | null = null;
  let bestD = Infinity;
  for (const n of st.sim.nodes) {
    const reach = n.r + 8 / st.cam.k;
    const d = (n.x - wx) ** 2 + (n.y - wy) ** 2;
    if (d <= reach * reach && d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

function overlap(a: Box, b: Box) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w + 6 && Math.abs(a.y - b.y) * 2 < a.h + b.h + 4;
}

function visibleCenter(st: ChartState) {
  const narrow = st.w < 768;
  const padT = narrow ? 228 : 96;
  const padB = narrow ? 96 : 84;
  return { x: st.w / 2, y: (padT + (st.h - padB)) / 2, padT, padB };
}

function fitCamera(st: ChartState, ids: string[] | null): Cam | null {
  const allow = ids ? new Set(ids) : null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const n of st.sim.nodes) {
    if (allow && !allow.has(n.id)) continue;
    any = true;
    minX = Math.min(minX, n.x - n.r);
    minY = Math.min(minY, n.y - n.r);
    maxX = Math.max(maxX, n.x + n.r);
    maxY = Math.max(maxY, n.y + n.r);
  }
  if (!any) return null;
  const bw = Math.max(48, maxX - minX);
  const bh = Math.max(48, maxY - minY);
  const { x: vx, y: vy, padT, padB } = visibleCenter(st);
  const padX = 56;
  const k = clamp(Math.min((st.w - padX * 2) / bw, (st.h - padT - padB) / bh), K_MIN, K_MAX);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { k, x: vx - cx * k, y: vy - cy * k };
}

function focusCamera(st: ChartState, id: string): Cam | null {
  const n = st.byId.get(id);
  if (!n) return null;
  const { x: vx, y: vy } = visibleCenter(st);
  const k = clamp(Math.max(st.cam.k, 1.25), K_MIN, K_MAX);
  return { k, x: vx - n.x * k, y: vy - n.y * k };
}

function animateTo(st: ChartState, to: Cam | null) {
  if (!to) return;
  if (st.reduce) {
    st.cam.x = to.x;
    st.cam.y = to.y;
    st.cam.k = to.k;
    st.anim = null;
    return;
  }
  st.anim = { from: { ...st.cam }, to, start: performance.now(), dur: 280 };
}

function tickCam(st: ChartState) {
  const anim = st.anim;
  if (!anim) return false;
  const t = anim.dur <= 0 ? 1 : Math.min(1, (performance.now() - anim.start) / anim.dur);
  const u = ease(t);
  st.cam.x = anim.from.x + (anim.to.x - anim.from.x) * u;
  st.cam.y = anim.from.y + (anim.to.y - anim.from.y) * u;
  st.cam.k = anim.from.k + (anim.to.k - anim.from.k) * u;
  if (t >= 1) st.anim = null;
  return st.anim !== null;
}

function resize(st: ChartState) {
  const canvas = st.canvas;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width);
  const h = Math.max(1, rect.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  st.w = w;
  st.h = h;
  st.dpr = dpr;
}

function syncHits(st: ChartState) {
  if (st.queryKey === st.query) return;
  st.queryKey = st.query;
  st.hits = searchChart(st.chart, st.query);
}

function drawShape(ctx: CanvasRenderingContext2D, n: SimNode) {
  const r = n.r;
  ctx.beginPath();
  if (n.kind === "craft") {
    ctx.moveTo(n.x, n.y - r);
    ctx.lineTo(n.x + r, n.y);
    ctx.lineTo(n.x, n.y + r);
    ctx.lineTo(n.x - r, n.y);
    ctx.closePath();
    return;
  }
  if (n.kind === "soft") {
    ctx.moveTo(n.x, n.y - r);
    ctx.lineTo(n.x + r * 0.9, n.y + r * 0.72);
    ctx.lineTo(n.x - r * 0.9, n.y + r * 0.72);
    ctx.closePath();
    return;
  }
  if (n.kind === "post") {
    const s = r * 0.92;
    ctx.rect(n.x - s, n.y - s, s * 2, s * 2);
    return;
  }
  if (n.kind === "net") {
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const x = n.x + Math.cos(a) * r;
      const y = n.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    return;
  }
  if (n.kind === "file") {
    const s = r * 0.86;
    ctx.moveTo(n.x - s, n.y - s);
    ctx.lineTo(n.x + s * 0.42, n.y - s);
    ctx.lineTo(n.x + s, n.y - s * 0.42);
    ctx.lineTo(n.x + s, n.y + s);
    ctx.lineTo(n.x - s, n.y + s);
    ctx.closePath();
    return;
  }
  ctx.arc(n.x, n.y, n.kind === "signal" || n.kind === "port" ? r : r * 0.92, 0, Math.PI * 2);
}

function draw(st: ChartState) {
  const ctx = st.ctx;
  if (!ctx) return;
  const { pal, cam, w, h, dpr } = st;
  const k = cam.k;
  syncHits(st);
  const hits = st.hits;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = pal.ink;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(k, k);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = pal.line;
  ctx.lineWidth = 1 / k;
  for (const rad of [150, 280, 430]) {
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = pal.mist;
  ctx.font = `${12 / k}px Outfit, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("N", 0, -442);
  ctx.globalAlpha = 1;

  type EdgeDraw = { a: SimNode; b: SimNode; id: string; label: string; rank: 0 | 1 | 2 };
  const edges: EdgeDraw[] = [];
  for (let i = 0; i < st.chart.edges.length; i += 1) {
    const edge = st.chart.edges[i];
    const a = st.byId.get(edge.source);
    const b = st.byId.get(edge.target);
    if (!a || !b) continue;
    let rank: 0 | 1 | 2 = 1;
    if (hits) {
      const hot = hits.edges.has(edge.id) || (hits.nodes.has(a.id) && hits.nodes.has(b.id));
      const touch = hits.nodes.has(a.id) || hits.nodes.has(b.id);
      rank = hot ? 2 : touch ? 1 : 0;
    } else if (st.selectedId === a.id || st.selectedId === b.id || st.hoverId === a.id || st.hoverId === b.id) {
      rank = 2;
    }
    edges.push({ a, b, id: edge.id, label: edge.label, rank });
  }

  const strokeRank = (rank: 0 | 1 | 2, alpha: number, color: string, width: number) => {
    ctx.beginPath();
    let any = false;
    for (const edge of edges) {
      if (edge.rank !== rank) continue;
      ctx.moveTo(edge.a.x, edge.a.y);
      ctx.lineTo(edge.b.x, edge.b.y);
      any = true;
    }
    if (!any) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width / k;
    ctx.stroke();
  };

  strokeRank(0, 0.08, pal.mist, 1);
  strokeRank(1, hits ? 0.28 : 0.55, pal.mist, 1);
  strokeRank(2, 0.95, pal.brass, 1.7);
  ctx.globalAlpha = 1;

  const nodeAlpha = (n: SimNode) => {
    if (!hits) return 1;
    return hits.nodes.has(n.id) ? 1 : 0.16;
  };

  const paintNode = (n: SimNode) => {
    const alpha = nodeAlpha(n);
    const color = kindColor(n.kind, pal);
    ctx.globalAlpha = alpha;
    drawShape(ctx, n);
    if (n.kind === "signal" || n.kind === "port") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6 / k;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(n.x, n.y, Math.max(1.4, n.r * 0.22), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
    const selected = st.selectedId === n.id;
    const hover = st.hoverId === n.id;
    const matched = Boolean(hits?.nodes.has(n.id));
    if (selected || hover || matched) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + (selected ? 7 : 5) / k, 0, Math.PI * 2);
      ctx.strokeStyle = selected ? pal.brass : hover ? pal.bone : color;
      ctx.lineWidth = (selected ? 1.7 : 1.1) / k;
      ctx.stroke();
    }
  };

  const ordered = [...st.sim.nodes].sort((a, b) => nodeAlpha(a) - nodeAlpha(b));
  for (const n of ordered) paintNode(n);
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.font = "500 12px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const boxes: Box[] = [];
  for (const n of st.sim.nodes) {
    const sx = n.x * k + cam.x;
    const sy = n.y * k + cam.y;
    const sr = Math.max(6, n.r * k);
    if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
    boxes.push({ x: sx, y: sy, w: sr * 2 + 6, h: sr * 2 + 6 });
  }
  type Label = { pri: number; box: Box; paint: () => void };
  const labels: Label[] = [];
  const labelsOn = k >= 0.78;

  for (const n of st.sim.nodes) {
    const sx = n.x * k + cam.x;
    const sy = n.y * k + cam.y;
    const sr = n.r * k;
    if (sx < -80 || sy < -80 || sx > w + 80 || sy > h + 80) continue;
    const selected = st.selectedId === n.id;
    const hover = st.hoverId === n.id;
    const matched = Boolean(hits?.nodes.has(n.id));
    if (hits && !matched && !selected && !hover) continue;
    if (!hits && !labelsOn && !selected && !hover) continue;
    const datum = st.chart.byId.get(n.id);
    if (!datum) continue;
    const text = datum.label.length > 32 ? `${datum.label.slice(0, 30)}…` : datum.label;
    const width = ctx.measureText(text).width;
    const box: Box = { x: sx, y: sy + sr + 12, w: width, h: 14 };
    const pri = selected ? 100 : hover ? 80 : matched ? 70 : 30;
    const dim = Boolean(hits && !matched);
    labels.push({
      pri,
      box,
      paint: () => {
        ctx.font = "500 12px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = dim ? withAlpha(pal.mist, 0.7) : pal.bone;
        ctx.fillText(text, sx, sy + sr + 4);
      },
    });
  }

  ctx.font = "500 11px Outfit, sans-serif";
  ctx.textBaseline = "middle";
  for (const edge of edges) {
    const x1 = edge.a.x * k + cam.x;
    const y1 = edge.a.y * k + cam.y;
    const x2 = edge.b.x * k + cam.x;
    const y2 = edge.b.y * k + cam.y;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const hot = edge.rank === 2;
    if (!hot && (!labelsOn || len < 64 || len > 520)) continue;
    if (hot && len < 36) continue;
    if (mx < -40 || my < -40 || mx > w + 40 || my > h + 40) continue;
    const width = ctx.measureText(edge.label).width;
    const box: Box = { x: mx, y: my, w: width + 10, h: 16 };
    labels.push({
      pri: hot ? 60 : 20,
      box,
      paint: () => {
        let ang = Math.atan2(y2 - y1, x2 - x1);
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(ang);
        ctx.font = "500 11px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = withAlpha(pal.ink, 0.84);
        ctx.beginPath();
        ctx.roundRect(-width / 2 - 4, -8, width + 8, 16, 4);
        ctx.fill();
        ctx.fillStyle = hot ? pal.brass : pal.mist;
        ctx.fillText(edge.label, 0, 0);
        ctx.restore();
      },
    });
  }

  labels.sort((a, b) => b.pri - a.pri);
  let drawn = 0;
  for (const label of labels) {
    if (drawn > 70) break;
    if (boxes.some((box) => overlap(box, label.box))) continue;
    boxes.push(label.box);
    label.paint();
    drawn += 1;
  }
}

function renderFrame(st: ChartState) {
  if (!st.alive || !st.canvas || !st.ctx) return false;
  resize(st);
  if (!st.didFit && st.w > 2 && st.h > 2) {
    const cam = fitCamera(st, null);
    if (cam) {
      st.cam = cam;
      st.didFit = true;
    }
  }
  const moving = step(st.sim);
  const camActive = tickCam(st);
  draw(st);
  const phase: GraphPhase = st.sim.frozen ? "frozen" : st.sim.alpha >= ALPHA_MIN ? "live" : "settled";
  if (phase !== st.phase) {
    st.phase = phase;
    st.onPhase(phase);
  }
  return moving || camActive || st.drag !== null || st.panning;
}

function wake(st: ChartState) {
  if (!st.alive || st.raf) return;
  const loop = () => {
    const keep = renderFrame(st);
    st.raf = keep ? requestAnimationFrame(loop) : 0;
  };
  st.raf = requestAnimationFrame(loop);
}

function applyPinch(st: ChartState) {
  const pinch = st.pinch;
  const canvas = st.canvas;
  if (!pinch || !canvas || st.pointers.size < 2) return;
  const pts = [...st.pointers.values()];
  const a = pts[0];
  const b = pts[1];
  if (!a || !b) return;
  const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const k = clamp(pinch.k * (dist / pinch.dist), K_MIN, K_MAX);
  st.cam.k = k;
  st.cam.x = midX - pinch.wx * k;
  st.cam.y = midY - pinch.wy * k;
  st.anim = null;
}

export const ForceGraph = forwardRef<ForceGraphHandle, Props>(function ForceGraph(
  { chart, query, selectedId, frozen, onSelect, onPhase },
  ref,
) {
  const stRef = useRef<ChartState | null>(null);
  if (stRef.current === null) stRef.current = createChartState(chart);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = stRef.current;
  st.query = query;
  st.selectedId = selectedId;
  st.frozenProp = frozen;
  st.sim.frozen = frozen;
  st.onSelect = onSelect;
  st.onPhase = onPhase;

  useImperativeHandle(ref, () => ({
    reheat() {
      const current = stRef.current;
      if (!current) return;
      reheat(current.sim);
      wake(current);
    },
    fitAll() {
      const current = stRef.current;
      if (!current) return;
      animateTo(current, fitCamera(current, null));
      wake(current);
    },
    fitIds(ids: string[]) {
      const current = stRef.current;
      if (!current) return;
      animateTo(current, fitCamera(current, ids));
      wake(current);
    },
    focus(id: string) {
      const current = stRef.current;
      if (!current) return;
      animateTo(current, focusCamera(current, id));
      wake(current);
    },
  }));

  useEffect(() => {
    const current = stRef.current;
    if (!current) return;
    current.query = query;
    current.selectedId = selectedId;
    current.sim.frozen = frozen;
    if (current.ready) wake(current);
  }, [query, selectedId, frozen]);

  useEffect(() => {
    const current = stRef.current;
    const canvas = canvasRef.current;
    if (!current || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    current.canvas = canvas;
    current.ctx = ctx;
    current.pal = readPalette();
    current.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    current.alive = true;
    current.ready = true;
    canvas.style.cursor = "grab";

    const onPointerDown = (event: PointerEvent) => {
      const p = localPoint(canvas, event);
      current.pointers.set(event.pointerId, p);
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort (synthetic events, lost pointers).
      }
      if (current.pointers.size >= 2) {
        if (current.drag) current.drag.fixed = false;
        current.drag = null;
        current.panning = false;
        current.down = null;
        const pts = [...current.pointers.values()];
        const a = pts[0];
        const b = pts[1];
        if (!a || !b) return;
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        current.pinch = {
          dist,
          k: current.cam.k,
          wx: (midX - current.cam.x) / current.cam.k,
          wy: (midY - current.cam.y) / current.cam.k,
        };
        current.anim = null;
        wake(current);
        return;
      }
      const node = hitNode(current, p.x, p.y);
      current.anim = null;
      current.down = { x: p.x, y: p.y, moved: false, nodeId: node?.id ?? null };
      current.lastPan = p;
      if (node) {
        node.fixed = true;
        current.drag = node;
        current.onSelect(node.id);
        canvas.style.cursor = "grabbing";
      } else {
        current.panning = true;
        canvas.style.cursor = "grabbing";
      }
      wake(current);
    };

    const onPointerMove = (event: PointerEvent) => {
      const p = localPoint(canvas, event);
      if (!current.pointers.has(event.pointerId)) {
        const node = hitNode(current, p.x, p.y);
        const id = node?.id ?? null;
        if (id !== current.hoverId) {
          current.hoverId = id;
          canvas.style.cursor = id ? "pointer" : "grab";
          wake(current);
        }
        return;
      }
      current.pointers.set(event.pointerId, p);
      if (current.pointers.size >= 2 && current.pinch) {
        applyPinch(current);
        wake(current);
        return;
      }
      const down = current.down;
      if (!down) return;
      const dx = p.x - down.x;
      const dy = p.y - down.y;
      if (!down.moved && dx * dx + dy * dy > 16) down.moved = true;
      if (current.drag) {
        const wx = (p.x - current.cam.x) / current.cam.k;
        const wy = (p.y - current.cam.y) / current.cam.k;
        current.drag.vx = (wx - current.drag.x) * 0.45;
        current.drag.vy = (wy - current.drag.y) * 0.45;
        current.drag.x = wx;
        current.drag.y = wy;
        if (!current.sim.frozen) current.sim.alpha = Math.max(current.sim.alpha, 0.35);
      } else if (current.panning && current.lastPan) {
        current.cam.x += p.x - current.lastPan.x;
        current.cam.y += p.y - current.lastPan.y;
        current.lastPan = p;
      }
      wake(current);
    };

    const endPointer = (event: PointerEvent) => {
      current.pointers.delete(event.pointerId);
      if (current.pointers.size < 2) current.pinch = null;
      if (current.pointers.size > 0) {
        wake(current);
        return;
      }
      const down = current.down;
      if (current.drag) {
        current.drag.fixed = false;
        current.drag = null;
      }
      if (down && !down.moved && !down.nodeId) current.onSelect(null);
      current.panning = false;
      current.down = null;
      current.lastPan = null;
      canvas.style.cursor = "grab";
      wake(current);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const p = localPoint(canvas, event);
      let dy = event.deltaY;
      if (event.deltaMode === 1) dy *= 16;
      if (event.deltaMode === 2) dy *= 100;
      const factor = Math.exp(-dy * 0.0014);
      const next = clamp(current.cam.k * factor, K_MIN, K_MAX);
      const wx = (p.x - current.cam.x) / current.cam.k;
      const wy = (p.y - current.cam.y) / current.cam.k;
      current.cam.k = next;
      current.cam.x = p.x - wx * next;
      current.cam.y = p.y - wy * next;
      current.anim = null;
      wake(current);
    };

    const onDoubleClick = (event: MouseEvent) => {
      event.preventDefault();
      const p = localPoint(canvas, event);
      const node = hitNode(current, p.x, p.y);
      if (node) animateTo(current, focusCamera(current, node.id));
      else animateTo(current, fitCamera(current, null));
      wake(current);
    };

    const observer = new ResizeObserver(() => wake(current));
    observer.observe(canvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDoubleClick);

    const fonts = document.fonts;
    const onFonts = () => wake(current);
    fonts?.addEventListener("loadingdone", onFonts);
    void fonts?.ready.then(onFonts);

    resize(current);
    wake(current);

    return () => {
      current.alive = false;
      current.ready = false;
      if (current.raf) cancelAnimationFrame(current.raf);
      current.raf = 0;
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onDoubleClick);
      fonts?.removeEventListener("loadingdone", onFonts);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
      aria-label="Force-directed chart. Drag a mark to move it, drag empty space to pan, scroll or pinch to zoom."
    />
  );
});
