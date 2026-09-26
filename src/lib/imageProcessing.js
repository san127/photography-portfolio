// Prepares a photograph in the browser before upload:
//  - a "full" version (long edge capped at FULL_MAX; originals under the cap are kept untouched)
//  - a "thumb" version for the gallery grid, so visitors don't download huge files up front
//  - the real pixel dimensions, so the gallery can reserve the correct space (no layout jumps)

const FULL_MAX = 2560;
const THUMB_MAX = 1000;
const KEEP_AS_IS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function loadSource(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      // 'from-image' applies the EXIF rotation so phone photos aren't sideways
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch (_) {
      /* fall through to the <img> approach */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error("This browser can't read that file. Try exporting it as a JPEG first."));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function scaleToJpeg({ source, width, height }, maxEdge, quality) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // flatten transparent PNGs onto white
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process this image.'))),
      'image/jpeg',
      quality
    );
  });
}

export async function processImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.');
  const src = await loadSource(file);
  try {
    const { width, height } = src;
    const thumb = await scaleToJpeg(src, THUMB_MAX, 0.82);

    const keepExt = KEEP_AS_IS[file.type];
    if (keepExt && Math.max(width, height) <= FULL_MAX) {
      return { full: file, fullType: file.type, ext: keepExt, thumb, width, height };
    }
    const full = await scaleToJpeg(src, FULL_MAX, 0.9);
    return { full, fullType: 'image/jpeg', ext: 'jpg', thumb, width, height };
  } finally {
    src.close();
  }
}
