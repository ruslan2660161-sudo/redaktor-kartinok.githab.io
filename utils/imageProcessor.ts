
import { ImageFormat, ProcessedResult } from '../types';
import { PADDING_RATIO, JPG_QUALITY } from '../constants';

/**
 * Processes a single file into multiple formats
 */
export async function processImageFile(
  file: File,
  formats: ImageFormat[]
): Promise<ProcessedResult[]> {
  const image = await loadImage(file);
  const results: ProcessedResult[] = [];

  for (const format of formats) {
    const blob = await renderToCanvas(image, format);
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
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Renders the image to a white-background canvas with padding and centering
 */
function renderToCanvas(img: HTMLImageElement, format: ImageFormat): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // 1. Fill background white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Calculate drawing area with padding (85% of smaller side)
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

    // 5. Draw (equivalent to high quality / Lanczos in many modern browsers)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // 6. Export as JPG
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
