/**
 * Client-side image compression using Canvas.
 * Resizes and compresses to target size in KB (for profile images).
 */

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MAX_HEIGHT = 1200;
const DEFAULT_TARGET_KB = 300;
const MIN_QUALITY = 0.5;

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  targetSizeKb?: number;
  quality?: number;
}

/**
 * Compress an image file to ~targetSizeKb (default 300 KB).
 * Returns a Blob (JPEG). Use for profile photos before upload.
 */
export function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const targetSizeKb = options.targetSizeKb ?? DEFAULT_TARGET_KB;
  const targetBytes = targetSizeKb * 1024;

  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      let w = width;
      let h = height;
      if (w > maxWidth || h > maxHeight) {
        const r = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      const tryQuality = (quality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            if (blob.size <= targetBytes || quality <= MIN_QUALITY) {
              resolve(blob);
              return;
            }
            tryQuality(Math.max(MIN_QUALITY, quality - 0.1));
          },
          'image/jpeg',
          quality
        );
      };
      tryQuality(0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/** 20MB in bytes */
export const MAX_PROFILE_IMAGE_BYTES = 20 * 1024 * 1024;

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/** HEIC/HEIF (e.g. iPhone photos) – by MIME type or file extension */
export function isHeicFile(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  if (t === 'image/heic' || t === 'image/heif') return true;
  const name = (file.name || '').toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif');
}

/**
 * Convert HEIC/HEIF to JPEG in the browser. Returns a File for use with compressImage.
 * Use when isHeicFile(file) is true.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  if (!blob) throw new Error('HEIC conversion produced no image');
  const name = file.name.replace(/\.[^.]+$/i, '.jpg') || 'photo.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
