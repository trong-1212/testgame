import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Fruit, Bomb, Particle, SliceTrailPoint, GameState,
  GRAVITY, SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX, MAX_LIVES,
} from './types';
import {
  spawnFruit, spawnBomb, updateFruit, updateBomb,
  createParticles, updateParticle, pruneTrail,
  lineCircleIntersect, fruitColor,
} from './engine';

interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onGameOver: () => void;
}

export function useGameCanvas(callbacks: GameCallbacks) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    fruits: [] as Fruit[],
    bombs: [] as Bomb[],
    particles: [] as Particle[],
    trail: [] as SliceTrailPoint[],
    slicing: false,
    score: 0,
    lives: MAX_LIVES,
    lastSpawn: 0,
    nextSpawnDelay: 1000,
    animId: 0,
    lastTime: 0,
    running: false,
    difficulty: 1,
  });

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.fruits = [];
    s.bombs = [];
    s.particles = [];
    s.trail = [];
    s.slicing = false;
    s.score = 0;
    s.lives = MAX_LIVES;
    s.lastSpawn = 0;
    s.nextSpawnDelay = 1000;
    s.difficulty = 1;
    callbacks.onScoreChange(0);
    callbacks.onLivesChange(MAX_LIVES);
  }, [callbacks]);

  const start = useCallback(() => {
    reset();
    stateRef.current.running = true;
    stateRef.current.lastTime = performance.now();
  }, [reset]);

  const getPos = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0] || (e as TouchEvent).changedTouches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = stateRef.current;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      s.slicing = true;
      const pos = getPos(e);
      s.trail = [{ ...pos, time: performance.now() }];
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!s.slicing) return;
      const pos = getPos(e);
      const now = performance.now();
      s.trail = pruneTrail([...s.trail, { ...pos, time: now }], now);
    };
    const onUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      s.slicing = false;
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp, { passive: false });

    const loop = (time: number) => {
      s.animId = requestAnimationFrame(loop);
      if (!s.running) {
        drawBackground(ctx, canvas);
        return;
      }

      const rawDt = time - s.lastTime;
      s.lastTime = time;
      const dt = Math.min(rawDt / 16.667, 3);

      // Spawn
      s.difficulty = 1 + s.score * 0.02;
      if (time - s.lastSpawn > s.nextSpawnDelay) {
        s.lastSpawn = time;
        const interval = SPAWN_INTERVAL_MAX - (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN) * Math.min(s.difficulty / 5, 1);
        s.nextSpawnDelay = interval * (0.7 + Math.random() * 0.6);
        const count = Math.random() < 0.3 + s.difficulty * 0.05 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          s.fruits.push(spawnFruit(canvas.clientWidth, canvas.clientHeight));
        }
        if (Math.random() < 0.12 + s.difficulty * 0.02) {
          s.bombs.push(spawnBomb(canvas.clientWidth, canvas.clientHeight));
        }
      }

      // Update fruits
      for (const f of s.fruits) {
        if (f.sliced) continue;
        updateFruit(f, dt);
      }

      // Update bombs
      for (const b of s.bombs) {
        if (b.sliced) continue;
        updateBomb(b, dt);
      }

      // Update particles
      for (const p of s.particles) updateParticle(p, dt);
      s.particles = s.particles.filter(p => p.life > 0);

      // Slice detection
      const now = performance.now();
      s.trail = pruneTrail(s.trail, now);
      if (s.trail.length >= 2) {
        for (let i = 1; i < s.trail.length; i++) {
          const a = s.trail[i - 1];
          const b = s.trail[i];
          for (const f of s.fruits) {
            if (f.sliced) continue;
            if (lineCircleIntersect(a, b, { x: f.x, y: f.y }, f.radius)) {
              f.sliced = true;
              s.score++;
              callbacks.onScoreChange(s.score);
              s.particles.push(...createParticles(f.x, f.y, fruitColor(f.emoji)));
            }
          }
          for (const bomb of s.bombs) {
            if (bomb.sliced) continue;
            if (lineCircleIntersect(a, b, { x: bomb.x, y: bomb.y }, bomb.radius)) {
              bomb.sliced = true;
              s.particles.push(...createParticles(bomb.x, bomb.y, '#333'));
              s.running = false;
              callbacks.onGameOver();
              return;
            }
          }
        }
      }

      // Miss detection
      const ch = canvas.clientHeight;
      for (const f of s.fruits) {
        if (f.sliced || f.missed) continue;
        if (f.y > ch + 60 && f.vy > 0) {
          f.missed = true;
          s.lives = Math.max(0, s.lives - 1);
          callbacks.onLivesChange(s.lives);
          if (s.lives <= 0) {
            s.running = false;
            callbacks.onGameOver();
            return;
          }
        }
      }

      // Cleanup
      s.fruits = s.fruits.filter(f => f.y < ch + 120 && (!f.sliced || f.y < ch + 120));
      s.bombs = s.bombs.filter(b => b.y < ch + 120);

      // Draw
      drawBackground(ctx, canvas);
      drawFruits(ctx, s.fruits);
      drawBombs(ctx, s.bombs);
      drawParticles(ctx, s.particles);
      drawTrail(ctx, s.trail, now);
    };

    s.animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(s.animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
  }, [callbacks, getPos]);

  return { canvasRef, start, reset };
}

function drawBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0e1a');
  grad.addColorStop(0.5, '#111827');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle radial glow
  const rg = ctx.createRadialGradient(w / 2, h * 0.7, 0, w / 2, h * 0.7, w * 0.6);
  rg.addColorStop(0, 'rgba(59, 130, 246, 0.06)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
}

function drawFruits(ctx: CanvasRenderingContext2D, fruits: Fruit[]) {
  for (const f of fruits) {
    if (f.sliced) continue;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);

    // Glow
    ctx.shadowColor = fruitColor(f.emoji);
    ctx.shadowBlur = 18;
    ctx.font = `${f.radius * 1.6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.emoji, 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

function drawBombs(ctx: CanvasRenderingContext2D, bombs: Bomb[]) {
  for (const b of bombs) {
    if (b.sliced) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);

    // Red glow for danger
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 22;
    ctx.font = `${b.radius * 1.6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, trail: SliceTrailPoint[], now: number) {
  if (trail.length < 2) return;
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    const ageA = 1 - (now - a.time) / 150;
    const ageB = 1 - (now - b.time) / 150;
    const alpha = Math.max(0, (ageA + ageB) / 2);
    const width = 3 + alpha * 5;

    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 15;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }
}
