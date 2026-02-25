
import { ImageFormat, ProcessedResult, ShadowConfig } from '../types';
import { PADDING_RATIO, JPG_QUALITY } from '../constants';

/**
 * Processes a single file into multiple formats
 */
export async function processImageFile(
  file: File,
  formats: ImageFormat[],
  applyShadow: boolean = false,
  backgroundColor: string = '#FFFFFF',
  shadowConfig?: ShadowConfig
): Promise<ProcessedResult[]> {
  const image = await loadImage(file);
  const results: ProcessedResult[] = [];

  const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
  
  for (let i = 0; i < formats.length; i++) {
    const format = formats[i];
    const blob = await renderToCanvas(image, format, applyShadow, backgroundColor, shadowConfig);
    results.push({
      formatId: format.id,
      blob,
      fileName: `${baseName}.${i + 1}.jpg`
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
  backgroundColor: string,
  shadowConfig?: ShadowConfig
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
    if (applyShadow && shadowConfig) {
      ctx.save();
      
      // Convert hex to rgba for opacity support
      let shadowColor = shadowConfig.color;
      if (shadowColor.startsWith('#')) {
        const r = parseInt(shadowColor.slice(1, 3), 16);
        const g = parseInt(shadowColor.slice(3, 5), 16);
        const b = parseInt(shadowColor.slice(5, 7), 16);
        shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowConfig.opacity})`;
      }

      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowConfig.blur;
      ctx.shadowOffsetX = shadowConfig.offsetX;
      ctx.shadowOffsetY = shadowConfig.offsetY;
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
