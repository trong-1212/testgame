import {
  Fruit, Bomb, Particle, SliceTrailPoint, Vector2,
  GRAVITY, FRUIT_EMOJIS, BOMB_EMOJI, TRAIL_DURATION, PARTICLE_COUNT,
} from './types';

let nextId = 0;

export function spawnFruit(canvasW: number, canvasH: number): Fruit {
  const x = 80 + Math.random() * (canvasW - 160);
  const targetH = canvasH * (0.35 + Math.random() * 0.35);
  const vy = -Math.sqrt(2 * GRAVITY * (canvasH - targetH + 50));
  const vx = (Math.random() - 0.5) * 4;
  return {
    id: nextId++,
    x,
    y: canvasH + 40,
    vx,
    vy,
    radius: 28 + Math.random() * 12,
    emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    sliced: false,
    missed: false,
  };
}

export function spawnBomb(canvasW: number, canvasH: number): Bomb {
  const x = 80 + Math.random() * (canvasW - 160);
  const targetH = canvasH * (0.35 + Math.random() * 0.35);
  const vy = -Math.sqrt(2 * GRAVITY * (canvasH - targetH + 50));
  const vx = (Math.random() - 0.5) * 3;
  return {
    id: nextId++,
    x,
    y: canvasH + 40,
    vx,
    vy,
    radius: 30,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.12,
    sliced: false,
  };
}

export function updateFruit(f: Fruit, dt: number): void {
  f.vy += GRAVITY * dt;
  f.x += f.vx * dt;
  f.y += f.vy * dt;
  f.rotation += f.rotationSpeed * dt;
}

export function updateBomb(b: Bomb, dt: number): void {
  b.vy += GRAVITY * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.rotation += b.rotationSpeed * dt;
}

export function createParticles(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 1,
      color,
      size: 3 + Math.random() * 5,
    });
  }
  return particles;
}

export function updateParticle(p: Particle, dt: number): void {
  p.vy += GRAVITY * 0.3 * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.life -= 0.025 * dt;
}

export function pruneTrail(trail: SliceTrailPoint[], now: number): SliceTrailPoint[] {
  return trail.filter(p => now - p.time < TRAIL_DURATION);
}

export function lineCircleIntersect(
  a: Vector2, b: Vector2, center: Vector2, radius: number,
): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - center.x;
  const fy = a.y - center.y;
  const A = dx * dx + dy * dy;
  if (A === 0) return Math.hypot(fx, fy) <= radius;
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - radius * radius;
  let disc = B * B - 4 * A * C;
  if (disc < 0) return false;
  disc = Math.sqrt(disc);
  const t1 = (-B - disc) / (2 * A);
  const t2 = (-B + disc) / (2 * A);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
}

export function fruitColor(emoji: string): string {
  const map: Record<string, string> = {
    '🍎': '#ff3b30', '🍊': '#ff9500', '🍋': '#ffcc00',
    '🍉': '#34c759', '🍇': '#af52de', '🍓': '#ff2d55',
    '🍑': '#ff6b6b', '🥝': '#30d158', '🍌': '#ffd60a', '🍍': '#ffb340',
  };
  return map[emoji] || '#ff9500';
}
