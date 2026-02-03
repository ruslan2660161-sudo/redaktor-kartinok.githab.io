
import { ImageFormat } from './types';

export const DEFAULT_FORMATS: ImageFormat[] = [
  { id: '1', width: 1000, height: 1000, label: 'Square (1:1)' },
  { id: '2', width: 1080, height: 1320, label: 'Portrait (Instagram/Ozon)' },
  { id: '3', width: 1080, height: 607, label: 'Landscape (Horizontal)' }
];

export const PADDING_RATIO = 0.15; // 15% from edges
export const JPG_QUALITY = 0.95;
