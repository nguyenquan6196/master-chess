'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CUSTOM_ELO, type BotId } from '@/core/bot/levels';
import { suggestBot } from '@/core/bot/suggest';
import type { Color } from '@/core/chess/game';
import { createBotGame, resignGame } from '@/core/game/botGame';
import type { GameRecord } from '@/core/profile/schema';
import { rankStatus } from '@/core/rating/rank';
import { playSfx } from '@/services/audio/sfx';
import { gameRepo } from '@/services/db/repositories';
import { getEngine } from '@/services/engine/StockfishEngine';
import { useHistoryStep } from '@/services/navigation/historyStep';
import { useSession } from '@/services/profile/session';
import { settleBotGame } from '@/services/rating/gameRating';
import { BotGameView } from './BotGameView';
import { BotSetup, type SetupChoice } from './BotSetup';

type View =
  | { kind: 'loading' }
  | { kind: 'setup'; ongoing: GameRecord | null }
  | { kind: 'game'; game: GameRecord };

const DEFAULT_CHOICE: SetupChoice = {
  botId: 'chick',
  customElo: CUSTOM_ELO.default,
  style: 'balanced',
  color: 'w',
  timeControl: 'none',
};

/** Recent finished games considered for the suggested opponent. */
const SUGGEST_RECENT_GAMES = 10;

const choiceOf = (g: GameRecord): SetupChoice => ({
  botId: g.botId,
  customElo: g.customElo ?? CUSTOM_ELO.default,
  style: g.style,
  color: g.playerColor,
  timeControl: g.clock.timeControl,
});

function pickColor(choice: SetupChoice['color']): Color {
  if (choice !== 'random') return choice;
  return Math.random() < 0.5 ? 'w' : 'b';
}

export function BotGameScreen() {
  const t = useTranslations('botGame');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const profileId = useSession((s) => s.profile?.id);
  const gameRating = useSession((s) => s.profile?.gameRating.rating);
  const rankFloor = useSession((s) => s.profile?.rankFloor);
  const [suggested, setSuggested] = useState<BotId | null>(null);
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [lastChoice, setLastChoice] = useState<SetupChoice>(DEFAULT_CHOICE);
  /** Abandoning the unfinished game (optionally starting a new one) needs confirmation. */
  const [pendingAbandon, setPendingAbandon] = useState<{ next: SetupChoice | null } | null>(null);
  useHistoryStep(view.kind === 'game', () => void backToSetup());

  useEffect(() => {
    if (!profileId) return;
    void gameRepo.getOngoing(profileId).then((ongoing) => {
      setView({ kind: 'setup', ongoing: ongoing ?? null });
      if (ongoing) setLastChoice(choiceOf(ongoing));
    });
    // Warm up the engine while the player chooses (~2 MB, cached afterwards).
    const idle = setTimeout(
      () =>
        void getEngine('bot')
          .init()
          .catch(() => undefined),
      300,
    );
    return () => clearTimeout(idle);
  }, [profileId]);

  // Suggested opponent: refreshed whenever the setup screen shows or the rating changes.
  const inSetup = view.kind === 'setup';
  useEffect(() => {
    if (!profileId || !inSetup || gameRating === undefined) return;
    let cancelled = false;
    void gameRepo.listByProfile(profileId).then((games) => {
      const recent = games
        .filter((g) => g.status === 'finished' && g.result && g.botId !== 'custom')
        .slice(0, SUGGEST_RECENT_GAMES)
        .map((g) => ({ result: g.result ?? 'draw' }));
      if (!cancelled) setSuggested(suggestBot(gameRating, recent));
    });
    return () => {
      cancelled = true;
    };
  }, [profileId, inSetup, gameRating]);

  if (!profileId || view.kind === 'loading') return <div aria-busy="true" />;

  async function start(choice: SetupChoice, abandon: GameRecord | null) {
    if (!profileId) return;
    if (abandon) await resign(abandon);
    const game = createBotGame({
      id: gameRepo.newId(),
      profileId,
      botId: choice.botId,
      customElo: choice.customElo,
      style: choice.style,
      playerColor: pickColor(choice.color),
      timeControl: choice.timeControl,
      now: Date.now(),
    });
    await gameRepo.save(game);
    setLastChoice(choice);
    void getEngine('bot')
      .newGame()
      .catch(() => undefined);
    playSfx('gameStart');
    setView({ kind: 'game', game });
  }

  async function resign(game: GameRecord) {
    const resigned = resignGame(game, Date.now());
    await gameRepo.save(resigned);
    await settleBotGame(resigned);
  }

  async function abandon(ongoing: GameRecord, next: SetupChoice | null) {
    if (next) return start(next, ongoing);
    await resign(ongoing);
    setView({ kind: 'setup', ongoing: null });
  }

  async function backToSetup() {
    if (!profileId) return;
    const ongoing = await gameRepo.getOngoing(profileId);
    setView({ kind: 'setup', ongoing: ongoing ?? null });
  }

  if (view.kind === 'game') {
    return (
      <div className="flex flex-col gap-4">
        <BotGameView
          key={view.game.id}
          initial={view.game}
          onRematch={(g) => void start(choiceOf(g), null)}
          onChangeBot={() => void backToSetup()}
        />
      </div>
    );
  }

  const ongoing = view.ongoing;
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/play" label={tn('play')} />
      <BotSetup
        initial={lastChoice}
        ongoing={ongoing}
        rank={gameRating !== undefined ? rankStatus(gameRating, rankFloor ?? 0) : null}
        suggested={suggested}
        onStart={(choice) =>
          ongoing ? setPendingAbandon({ next: choice }) : void start(choice, null)
        }
        onContinue={() => ongoing && setView({ kind: 'game', game: ongoing })}
        onAbandon={() => setPendingAbandon({ next: null })}
      />
      <Modal
        open={pendingAbandon !== null}
        title={t('abandon')}
        onClose={() => setPendingAbandon(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setPendingAbandon(null)}>
              {tc('cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const pending = pendingAbandon;
                setPendingAbandon(null);
                if (pending && ongoing) void abandon(ongoing, pending.next);
              }}
            >
              {tc('confirm')}
            </Button>
          </>
        }
      >
        {t('abandonConfirm')}
      </Modal>
    </div>
  );
}
