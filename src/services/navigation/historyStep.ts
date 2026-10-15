'use client';

import { useEffect, useRef } from 'react';

/**
 * Makes an in-page sub-screen (a quiz round, a puzzle theme, a bot game…) a step in the
 * browser history, so the Back button / gesture leaves the sub-screen instead of the page.
 *
 * While `open` is true one extra history entry (same URL) exists. Back pops it and calls
 * `onClose`; closing in-app (open → false) consumes the entry with `history.back()`.
 * Unmounting (navigating elsewhere through a link) leaves history alone.
 */
export function useHistoryStep(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  const mounted = useRef(true);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let popped = false;
    window.history.pushState(window.history.state, '');
    const onPop = () => {
      popped = true;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!popped && mounted.current) window.history.back();
    };
  }, [open]);
}
