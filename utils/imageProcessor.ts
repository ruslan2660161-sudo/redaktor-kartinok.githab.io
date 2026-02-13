
import { ImageFormat, ProcessedResult } from '../types';
import { PADDING_RATIO, JPG_QUALITY } from '../constants';

/**
 * Processes a single file into multiple formats
 */
export async function processImageFile(
  file: File,
  formats: ImageFormat[],
  applyShadow: boolean = false,
  backgroundColor: string = '#FFFFFF'
): Promise<ProcessedResult[]> {
  const image = await loadImage(file);
  const results: ProcessedResult[] = [];

  for (const format of formats) {
    const blob = await renderToCanvas(image, format, applyShadow, backgroundColor);
    const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
    results.push({
      formatId: format.id,
      blob,
      fileName: `${baseName}_${format.width}x${format.height}.jpg`
    });
  }

  return results;
}

/**
 * Loads an image from a File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Renders the image to a canvas with custom background, padding and centering
 */
function renderToCanvas(
  img: HTMLImageElement, 
  format: ImageFormat, 
  applyShadow: boolean, 
  backgroundColor: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // 1. Fill background with selected color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Calculate drawing area with padding
    const paddingX = format.width * PADDING_RATIO;
    const paddingY = format.height * PADDING_RATIO;
    const availableWidth = format.width - (paddingX * 2);
    const availableHeight = format.height - (paddingY * 2);

    // 3. Calculate scale to fit "Contain"
    const scale = Math.min(availableWidth / img.width, availableHeight / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    // 4. Center
    const offsetX = (format.width - drawWidth) / 2;
    const offsetY = (format.height - drawHeight) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 5. Draw Shadow if enabled
    if (applyShadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = -10; // Up is negative
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
    } else {
      // 6. Draw Image without shadow
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    // 7. Export as JPG
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      'image/jpeg',
      JPG_QUALITY
    );
  });
}
