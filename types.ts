
export interface ShadowConfig {
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
  color: string;
}

export interface ImageFormat {
  id: string;
  width: number;
  height: number;
  label: string;
}

export interface ProcessingFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  results?: ProcessedResult[];
}

export interface ProcessedResult {
  formatId: string;
  blob: Blob;
  fileName: string;
}
