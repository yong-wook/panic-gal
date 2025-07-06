import { GRID_SIZE } from './config.js';

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const COLS = canvas.width / GRID_SIZE;
export const ROWS = canvas.height / GRID_SIZE;