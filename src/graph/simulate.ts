import { DEGREE, EDGES, NODES, type Kind } from "@/graph/data";

export const ALPHA_MIN = 0.02;

export type SimNode = {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fixed: boolean;
};

export type SimLink = {
  source: number;
  target: number;
  rest: number;
};

export type Sim = {
  nodes: SimNode[];
  links: SimLink[];
  alpha: number;
  frozen: boolean;
};

const CHARGE = 2600;
const LINK_K = 0.042;
const CENTER = 0.0014;
const DAMP = 0.72;
const CUTOFF2 = 340 * 340;
const SPEED = 8;
const ALPHA_DECAY = 0.012;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SECTOR: Record<Kind, number> = {
  post: -0.5,
  craft: 1.15,
  signal: 2.75,
  person: 4.35,
};

export function createSim(): Sim {
  const rand = mulberry32(11);
  const seen: Record<Kind, number> = { post: 0, craft: 0, signal: 0, person: 0 };
  const totals: Record<Kind, number> = { post: 0, craft: 0, signal: 0, person: 0 };
  for (const n of NODES) totals[n.kind] += 1;

  const index = new Map(NODES.map((n, i) => [n.id, i]));
  const nodes: SimNode[] = NODES.map((n) => {
    const i = seen[n.kind];
    seen[n.kind] = i + 1;
    const count = Math.max(1, totals[n.kind]);
    const ang = SECTOR[n.kind] + (i / count) * 1.2;
    const rad = 170 + (i % 4) * 48;
    const deg = DEGREE.get(n.id) ?? 1;
    return {
      id: n.id,
      kind: n.kind,
      x: Math.cos(ang) * rad + (rand() - 0.5) * 18,
      y: Math.sin(ang) * rad + (rand() - 0.5) * 18,
      vx: 0,
      vy: 0,
      r: 7.5 + Math.sqrt(deg) * 2.5,
      fixed: false,
    };
  });

  const links: SimLink[] = EDGES.map((edge) => {
    const source = index.get(edge.source);
    const target = index.get(edge.target);
    if (source === undefined || target === undefined) {
      throw new Error(`Missing endpoint ${edge.id}`);
    }
    const same = nodes[source].kind === nodes[target].kind;
    return { source, target, rest: same ? 78 : 132 };
  });

  const sim: Sim = { nodes, links, alpha: 1, frozen: false };
  for (let i = 0; i < 120; i += 1) step(sim);
  return sim;
}

export function reheat(sim: Sim) {
  sim.frozen = false;
  sim.alpha = 1;
}

/** Integrate one frame. Returns false once the layout has cooled or is frozen. */
export function step(sim: Sim): boolean {
  if (sim.frozen || sim.alpha < ALPHA_MIN) return false;
  const { nodes, links } = sim;
  const a = sim.alpha;
  const n = nodes.length;

  for (let i = 0; i < n; i += 1) {
    const p = nodes[i];
    for (let j = i + 1; j < n; j += 1) {
      const q = nodes[j];
      let dx = p.x - q.x;
      let dy = p.y - q.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) {
        dx = 0.05 * (i - j || 1);
        dy = 0.05;
        d2 = dx * dx + dy * dy;
      }
      if (d2 > CUTOFF2) continue;
      const d = Math.sqrt(d2);
      const f = (CHARGE / d2) * a;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      if (!p.fixed) {
        p.vx += fx;
        p.vy += fy;
      }
      if (!q.fixed) {
        q.vx -= fx;
        q.vy -= fy;
      }
    }
  }

  for (const link of links) {
    const p = nodes[link.source];
    const q = nodes[link.target];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const d = Math.hypot(dx, dy) || 0.01;
    const f = (d - link.rest) * LINK_K * a;
    const fx = (dx / d) * f;
    const fy = (dy / d) * f;
    if (!p.fixed) {
      p.vx += fx;
      p.vy += fy;
    }
    if (!q.fixed) {
      q.vx -= fx;
      q.vy -= fy;
    }
  }

  for (const p of nodes) {
    if (p.fixed) {
      p.vx = 0;
      p.vy = 0;
      continue;
    }
    p.vx -= p.x * CENTER * a;
    p.vy -= p.y * CENTER * a;
    p.vx *= DAMP;
    p.vy *= DAMP;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > SPEED) {
      const scale = SPEED / sp;
      p.vx *= scale;
      p.vy *= scale;
    }
    p.x += p.vx;
    p.y += p.vy;
  }

  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < n; i += 1) {
      const p = nodes[i];
      for (let j = i + 1; j < n; j += 1) {
        const q = nodes[j];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const min = p.r + q.r + 12;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const overlap = min - d;
        const ux = dx / d;
        const uy = dy / d;
        if (!p.fixed && !q.fixed) {
          p.x -= ux * overlap * 0.5;
          p.y -= uy * overlap * 0.5;
          q.x += ux * overlap * 0.5;
          q.y += uy * overlap * 0.5;
        } else if (!p.fixed) {
          p.x -= ux * overlap;
          p.y -= uy * overlap;
        } else if (!q.fixed) {
          q.x += ux * overlap;
          q.y += uy * overlap;
        }
      }
    }
  }

  sim.alpha *= 1 - ALPHA_DECAY;
  return sim.alpha >= ALPHA_MIN;
}
