'use client';

import { useRef, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { ChessBoard } from '@/components/board/ChessBoard';
import { PieceSetPreview } from '@/components/board/PieceSetPreview';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import {
  ACCENTS,
  BACKDROP_LIMITS,
  BACKDROPS,
  BOARD_STYLES,
  BUTTON_STYLES,
  GRADIENTS,
  HIGHLIGHTS,
  MOVE_ANIMATIONS,
  PIECE_SETS,
  resolvePieceSet,
} from '@/core/profile/settingsOptions';
import { useSession } from '@/services/profile/session';
import { useSettings } from '@/services/settings/store';
import {
  ACCENT_PRESETS,
  BOARD_PRESETS,
  GRADIENT_PRESETS,
  HIGHLIGHT_PRESETS,
  THEME_INFO,
} from '@/services/theme/appearance';
import { removeBackdropImage, saveBackdropImage } from '@/services/theme/backdropImage';
import { THEME_PREFERENCES } from '@/services/theme/themes';
import { useResolvedTheme } from '@/services/theme/useResolvedTheme';
import { Segmented, SettingRow, SettingSection } from './controls';

/** Italian Game after 3…Bc5 with the last move highlighted: shows board, pieces, highlight. */
const PREVIEW_FEN = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';

/** Round colour chip; `selected` gets a ring. */
function Swatch({
  selected,
  label,
  onClick,
  background,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  background: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'size-8 rounded-full border border-border transition-transform hover:scale-110',
        selected && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
      )}
      style={{ background }}
    />
  );
}

/** "Theme default" chip shown before the colour swatches. */
function ThemeChip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold',
        selected ? 'border-accent bg-surface-2' : 'border-border text-muted hover:text-fg',
      )}
    >
      {label}
    </button>
  );
}

function Slider({
  value,
  max,
  step,
  label,
  format,
  onChange,
}: {
  value: number;
  max: number;
  step: number;
  label: string;
  format: (v: number) => ReactNode;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-40 accent-[var(--mc-accent)]"
      />
      <span className="w-12 text-sm text-muted tabular-nums">{format(value)}</span>
    </>
  );
}

export function AppearanceSettings() {
  const t = useTranslations('settings');
  const tg = useTranslations('game');
  const s = useSettings();
  const resolved = useResolvedTheme();
  const profileId = useSession((x) => x.profile?.id);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file || !profileId) return;
    await saveBackdropImage(profileId, file);
    useSettings.setState((st) => ({ backdrop: 'image', backdropVersion: st.backdropVersion + 1 }));
  }

  async function removeImage() {
    if (!profileId) return;
    await removeBackdropImage(profileId);
    useSettings.setState((st) => ({ backdrop: 'theme', backdropVersion: st.backdropVersion + 1 }));
  }

  return (
    <SettingSection title={`🎨 ${t('appearance')}`}>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {THEME_PREFERENCES.map((pref) => {
          const shown = pref === 'auto' ? resolved : pref;
          const [bg, light, dark, accent] = THEME_INFO[shown].swatch;
          const selected = s.theme === pref;
          return (
            <li key={pref}>
              <button
                type="button"
                aria-pressed={selected}
                title={pref === 'auto' ? t('autoHint') : undefined}
                onClick={() => s.setTheme(pref)}
                className={cn(
                  'flex h-full w-full flex-col items-center gap-1 rounded-xl border p-2 text-center text-xs leading-tight font-semibold mc-lift',
                  selected ? 'border-accent ring-2 ring-accent' : 'border-border',
                )}
              >
                <span
                  aria-hidden
                  className="relative grid size-12 grid-cols-2 overflow-hidden rounded-lg"
                  style={{ background: bg }}
                >
                  <span style={{ background: light }} />
                  <span style={{ background: dark }} />
                  <span style={{ background: dark }} />
                  <span style={{ background: light }} />
                  <span
                    className="absolute right-0.5 bottom-0.5 size-3 rounded-full border border-white/60"
                    style={{ background: accent }}
                  />
                </span>
                {t(`themes.${pref}`)}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-3 sm:flex-row sm:items-center">
        <div className="w-full max-w-48 self-center">
          <ChessBoard
            fen={PREVIEW_FEN}
            movableColor="none"
            lastMove={{ from: 'f8', to: 'c5' }}
            arrows={[{ from: 'f3', to: 'g5' }]}
            promotionLabels={{
              title: tg('choosePromotion'),
              cancel: tg('cancel'),
              pieces: {
                q: tg('pieces.q'),
                r: tg('pieces.r'),
                b: tg('pieces.b'),
                n: tg('pieces.n'),
              },
            }}
          />
        </div>
        <div className="flex flex-col items-start gap-2">
          <span className="text-xs font-bold tracking-wide text-muted uppercase">
            {t('preview')}
          </span>
          <div className="flex gap-2">
            <Button variant="primary">♟ {t('previewPrimary')}</Button>
            <Button>{t('previewSecondary')}</Button>
          </div>
        </div>
      </div>

      <SettingRow label={t('board')}>
        <ThemeChip
          selected={s.board === 'theme'}
          label={t('boards.theme')}
          onClick={() => s.update({ board: 'theme' })}
        />
        {BOARD_STYLES.filter((b) => b !== 'theme').map((b) => (
          <Swatch
            key={b}
            selected={s.board === b}
            label={t(`boards.${b}`)}
            onClick={() => s.update({ board: b })}
            background={`linear-gradient(135deg, ${BOARD_PRESETS[b][0]} 50%, ${BOARD_PRESETS[b][1]} 50%)`}
          />
        ))}
      </SettingRow>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('pieces')}</span>
        {/* Each set has its own shapes; "theme" follows the colour theme. */}
        <ul role="group" aria-label={t('pieces')} className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {PIECE_SETS.map((p) => {
            const selected = s.pieceSet === p;
            const drawn = resolvePieceSet(p, resolved);
            return (
              <li key={p}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => s.update({ pieceSet: p })}
                  className={cn(
                    'mc-lift flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border bg-surface-2/60 px-2 py-3 text-center text-xs leading-tight font-semibold',
                    selected ? 'border-accent ring-2 ring-accent' : 'border-border',
                  )}
                >
                  <PieceSetPreview set={drawn} />
                  {t(`pieceSets.${p}`)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <SettingRow label={t('accent')}>
        <ThemeChip
          selected={s.accent === 'theme'}
          label={t('accents.theme')}
          onClick={() => s.update({ accent: 'theme' })}
        />
        {ACCENTS.filter((a) => a !== 'theme').map((a) => (
          <Swatch
            key={a}
            selected={s.accent === a}
            label={t(`accents.${a}`)}
            onClick={() => s.update({ accent: a })}
            background={ACCENT_PRESETS[a][0]}
          />
        ))}
      </SettingRow>

      <SettingRow label={t('highlight')}>
        <ThemeChip
          selected={s.highlight === 'theme'}
          label={t('highlights.theme')}
          onClick={() => s.update({ highlight: 'theme' })}
        />
        {HIGHLIGHTS.filter((h) => h !== 'theme').map((h) => (
          <Swatch
            key={h}
            selected={s.highlight === h}
            label={t(`highlights.${h}`)}
            onClick={() => s.update({ highlight: h })}
            background={HIGHLIGHT_PRESETS[h][1]}
          />
        ))}
      </SettingRow>

      <SettingRow label={t('buttons')}>
        <Segmented
          label={t('buttons')}
          value={s.buttonStyle}
          onChange={(buttonStyle) => s.update({ buttonStyle })}
          options={BUTTON_STYLES.map((b) => ({ value: b, label: t(`buttonStyles.${b}`) }))}
        />
      </SettingRow>

      <SettingRow label={t('moveAnimation')}>
        <Segmented
          label={t('moveAnimation')}
          value={s.moveAnimation}
          onChange={(moveAnimation) => s.update({ moveAnimation })}
          options={MOVE_ANIMATIONS.map((m) => ({ value: m, label: t(`moveAnimations.${m}`) }))}
        />
      </SettingRow>

      <SettingRow label={t('backdrop')}>
        <Segmented
          label={t('backdrop')}
          value={s.backdrop}
          onChange={(backdrop) =>
            backdrop === 'image' ? fileInput.current?.click() : s.update({ backdrop })
          }
          options={BACKDROPS.map((b) => ({ value: b, label: t(`backdrops.${b}`) }))}
        />
      </SettingRow>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {s.backdrop === 'color' && (
        <SettingRow label={t('backdropColor')}>
          <input
            type="color"
            value={s.backdropColor}
            aria-label={t('backdropColor')}
            onChange={(e) => s.update({ backdropColor: e.target.value })}
            className="h-9 w-16 cursor-pointer rounded border border-border bg-transparent"
          />
        </SettingRow>
      )}
      {s.backdrop === 'gradient' && (
        <SettingRow label={t('backdrops.gradient')}>
          {GRADIENTS.map((g) => (
            <Swatch
              key={g}
              selected={s.backdropGradient === g}
              label={t(`gradients.${g}`)}
              onClick={() => s.update({ backdropGradient: g })}
              background={GRADIENT_PRESETS[g]}
            />
          ))}
        </SettingRow>
      )}
      {s.backdrop === 'image' && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fileInput.current?.click()}>🖼️ {t('upload')}</Button>
            <Button variant="ghost" onClick={() => void removeImage()}>
              {t('removeImage')}
            </Button>
          </div>
          <p className="text-xs text-muted">{t('imageHint')}</p>
        </div>
      )}
      <SettingRow label={t('dim')}>
        <Slider
          value={s.backdropDim}
          max={BACKDROP_LIMITS.dimMax}
          step={0.05}
          label={t('dim')}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(backdropDim) => s.update({ backdropDim })}
        />
      </SettingRow>
      <SettingRow label={t('blur')}>
        <Slider
          value={s.backdropBlur}
          max={BACKDROP_LIMITS.blurMaxPx}
          step={1}
          label={t('blur')}
          format={(v) => `${v}px`}
          onChange={(backdropBlur) => s.update({ backdropBlur })}
        />
      </SettingRow>
      <SettingRow label={t('motion')}>
        <Segmented
          label={t('motion')}
          value={s.backdropMotion}
          onChange={(backdropMotion) => s.update({ backdropMotion })}
          options={[
            { value: true, label: t('on') },
            { value: false, label: t('off') },
          ]}
        />
      </SettingRow>
    </SettingSection>
  );
}
