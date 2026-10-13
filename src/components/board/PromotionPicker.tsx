import type { ReactNode } from 'react';
import type { PromotionPiece } from '@/core/chess/game';

export interface PromotionLabels {
  title: string;
  cancel: string;
  pieces: Record<PromotionPiece, string>;
}

interface PromotionPickerProps {
  pieces: readonly PromotionPiece[];
  renderPiece: (piece: PromotionPiece) => ReactNode;
  labels: PromotionLabels;
  onChoose: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

export function PromotionPicker({
  pieces,
  renderPiece,
  labels,
  onChoose,
  onCancel,
}: PromotionPickerProps) {
  return (
    <div
      role="dialog"
      aria-label={labels.title}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/50 p-4"
      onClick={onCancel}
    >
      <p className="rounded-md bg-surface px-3 py-1 text-sm font-semibold text-fg">
        {labels.title}
      </p>
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {pieces.map((p) => (
          <button
            key={p}
            type="button"
            title={labels.pieces[p]}
            aria-label={labels.pieces[p]}
            onClick={() => onChoose(p)}
            className="size-16 rounded-xl bg-surface p-1 shadow-card transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent sm:size-20"
          >
            {renderPiece(p)}
          </button>
        ))}
      </div>
      <button type="button" onClick={onCancel} className="text-sm font-medium text-white underline">
        {labels.cancel}
      </button>
    </div>
  );
}
