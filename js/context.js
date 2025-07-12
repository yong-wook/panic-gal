import { GRID_SIZE, VIRTUAL_WORLD_WIDTH, VIRTUAL_WORLD_HEIGHT } from './config.js';

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const COLS = VIRTUAL_WORLD_WIDTH / GRID_SIZE;
export const ROWS = VIRTUAL_WORLD_HEIGHT / GRID_SIZE;