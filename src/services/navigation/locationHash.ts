'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

const getHash = () => decodeURIComponent(window.location.hash.slice(1));

/**
 * The URL hash without "#", kept in sync with navigation. Reading `location.hash` once
 * during render is not enough: after a client-side <Link> the URL is updated only after
 * the new page first renders.
 */
export function useLocationHash(): string {
  return useSyncExternalStore(subscribe, getHash, () => '');
}
