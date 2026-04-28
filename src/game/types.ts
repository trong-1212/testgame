export interface Vector2 {
  x: number;
  y: number;
}

export interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
  missed: boolean;
}

export interface Bomb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface SliceTrailPoint {
  x: number;
  y: number;
  time: number;
}

export type GameState = 'start' | 'playing' | 'gameover';

export const GRAVITY = 0.35;
export const FRUIT_EMOJIS = ['🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍑', '🥝', '🍌', '🍍'];
export const BOMB_EMOJI = '💣';
export const MAX_LIVES = 3;
export const SPAWN_INTERVAL_MIN = 600;
export const SPAWN_INTERVAL_MAX = 1200;
export const TRAIL_DURATION = 150;
export const PARTICLE_COUNT = 12;
