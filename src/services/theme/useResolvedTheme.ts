'use client';

import { useSyncExternalStore } from 'react';
import type { ThemeId } from '@/core/profile/settingsOptions';
import { useSettings } from '../settings/store';
import { resolveTheme } from './appearance';

const QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** The theme actually shown ("auto" resolved against the system preference). */
export function useResolvedTheme(): ThemeId {
  const pref = useSettings((s) => s.theme);
  const dark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  return resolveTheme(pref, dark);
}
