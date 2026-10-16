'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: ReactNode;
  children?: ReactNode;
  /** Buttons row. */
  actions?: ReactNode;
  onClose?: () => void;
}

/** Simple accessible overlay dialog. Escape and backdrop click call `onClose` (if given). */
export function Modal({ open, title, children, actions, onClose }: ModalProps) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  // Portalled to <body>: the backdrop always covers the whole viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface p-6 text-fg shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        {children && <div className="mt-2 text-muted">{children}</div>}
        {actions && <div className="mt-5 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
