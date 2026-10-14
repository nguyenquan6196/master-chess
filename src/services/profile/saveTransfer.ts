import { buildSaveFile, parseSaveFile } from '@/core/profile/saveFile';
import { gameRepo, profileRepo, puzzleRepo } from '../db/repositories';

function slug(name: string): string {
  const s = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return s || 'player';
}

/** Downloads the player's profile and games as a JSON save file (spec §8.2). */
export async function exportProfile(profileId: string): Promise<void> {
  const profile = await profileRepo.get(profileId);
  if (!profile) return;
  const games = await gameRepo.listByProfile(profileId);
  const attempts = await puzzleRepo.listAll(profileId);
  const now = Date.now();
  const file = buildSaveFile(profile, games, attempts, now);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `master-chess-${slug(profile.name)}-${new Date(now).toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads and validates a save file chosen by the user (does not write anything yet). */
export async function readSaveFile(file: File) {
  return parseSaveFile(await file.text());
}

export const importSave = profileRepo.importSave;
