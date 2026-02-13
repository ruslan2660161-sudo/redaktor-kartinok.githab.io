
import { ImageFormat } from './types';

export const DEFAULT_FORMATS: ImageFormat[] = [
  { id: '1', width: 1000, height: 1000, label: 'Square (1:1)' },
  { id: '2', width: 1080, height: 1350, label: 'Portrait (Instagram/Ozon)' },
  { id: '3', width: 1080, height: 607, label: 'Landscape (Horizontal)' }
];

export const PADDING_RATIO = 0.05; // 5% from each edge (image takes 90%)
export const JPG_QUALITY = 0.95;
