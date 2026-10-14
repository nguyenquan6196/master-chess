'use client';

import type { ReactNode } from 'react';
import { useSession } from '@/services/profile/session';
import { ProfilePicker } from './ProfilePicker';

/** Shows the "who's playing?" screen until a player is chosen (spec §8.1). */
export function ProfileGate({ children }: { children: ReactNode }) {
  const hydrated = useSession((s) => s.hydrated);
  const profile = useSession((s) => s.profile);

  if (!hydrated) {
    return <div className="flex-1" aria-busy="true" />;
  }
  if (!profile) return <ProfilePicker />;
  return <>{children}</>;
}
