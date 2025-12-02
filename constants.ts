import { PaperSize } from './types';

export const PAPER_SIZES: PaperSize[] = [
  // ISO
  { id: 'a3', name: 'A3', width: 297, height: 420, category: 'ISO' },
  { id: 'a3plus', name: 'A3+ (Super B)', width: 329, height: 483, category: 'ISO' },
  { id: 'a4', name: 'A4', width: 210, height: 297, category: 'ISO' },
  { id: 'a5', name: 'A5', width: 148, height: 210, category: 'ISO' },
  { id: 'a6', name: 'A6', width: 105, height: 148, category: 'ISO' },
  // ANSI / US
  { id: 'letter', name: 'Letter', width: 215.9, height: 279.4, category: 'ANSI' },
  { id: 'legal', name: 'Legal', width: 215.9, height: 355.6, category: 'ANSI' },
  { id: 'folio', name: 'Folio (Long Bond)', width: 215.9, height: 330.2, category: 'ANSI' },
  { id: 'tabloid', name: 'Tabloid', width: 279.4, height: 431.8, category: 'ANSI' },
  // Photo
  { id: '4x6', name: '4" x 6"', width: 101.6, height: 152.4, category: 'Photo' },
  { id: '5x7', name: '5" x 7"', width: 127, height: 177.8, category: 'Photo' },
  { id: '8x10', name: '8" x 10"', width: 203.2, height: 254, category: 'Photo' },
];

export const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

export const FONTS = [
  'Inter', 'Helvetica', 'Times New Roman', 'Courier New', 'Arial', 'Georgia'
];