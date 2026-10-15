import { getDb } from '../db/db';

/** Uploaded backdrops are downscaled so IndexedDB stays small. */
const MAX_SIDE_PX = 1920;
const JPEG_QUALITY = 0.85;

const keyOf = (profileId: string) => `backdrop:${profileId}`;

async function downscale(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('encode failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    ),
  );
}

/** Stores the player's backdrop image (replacing the previous one). */
export async function saveBackdropImage(profileId: string, file: Blob): Promise<void> {
  const blob = await downscale(file);
  await getDb().media.put({ id: keyOf(profileId), profileId, blob, updatedAt: Date.now() });
}

export async function loadBackdropImage(profileId: string): Promise<Blob | null> {
  const rec = await getDb().media.get(keyOf(profileId));
  return rec?.blob ?? null;
}

export async function removeBackdropImage(profileId: string): Promise<void> {
  await getDb().media.delete(keyOf(profileId));
}
