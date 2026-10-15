'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Color } from '@/core/chess/game';
import { createBotGame, resignGame } from '@/core/game/botGame';
import type { GameRecord } from '@/core/profile/schema';
import { playSfx } from '@/services/audio/sfx';
import { gameRepo } from '@/services/db/repositories';
import { getEngine } from '@/services/engine/StockfishEngine';
import { useHistoryStep } from '@/services/navigation/historyStep';
import { useSession } from '@/services/profile/session';
import { BotGameView } from './BotGameView';
import { BotSetup, type SetupChoice } from './BotSetup';

type View =
  | { kind: 'loading' }
  | { kind: 'setup'; ongoing: GameRecord | null }
  | { kind: 'game'; game: GameRecord };

const DEFAULT_CHOICE: SetupChoice = { botId: 'chick', color: 'w', timeControl: 'none' };

function pickColor(choice: SetupChoice['color']): Color {
  if (choice !== 'random') return choice;
  return Math.random() < 0.5 ? 'w' : 'b';
}

export function BotGameScreen() {
  const t = useTranslations('botGame');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const profileId = useSession((s) => s.profile?.id);
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [lastChoice, setLastChoice] = useState<SetupChoice>(DEFAULT_CHOICE);
  /** Abandoning the unfinished game (optionally starting a new one) needs confirmation. */
  const [pendingAbandon, setPendingAbandon] = useState<{ next: SetupChoice | null } | null>(null);
  useHistoryStep(view.kind === 'game', () => void backToSetup());

  useEffect(() => {
    if (!profileId) return;
    void gameRepo.getOngoing(profileId).then((ongoing) => {
      setView({ kind: 'setup', ongoing: ongoing ?? null });
      if (ongoing) {
        setLastChoice({
          botId: ongoing.botId,
          color: ongoing.playerColor,
          timeControl: ongoing.clock.timeControl,
        });
      }
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

  if (!profileId || view.kind === 'loading') return <div aria-busy="true" />;

  async function start(choice: SetupChoice, abandon: GameRecord | null) {
    if (!profileId) return;
    if (abandon) await gameRepo.save(resignGame(abandon, Date.now()));
    const game = createBotGame({
      id: gameRepo.newId(),
      profileId,
      botId: choice.botId,
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

  async function abandon(ongoing: GameRecord, next: SetupChoice | null) {
    if (next) return start(next, ongoing);
    await gameRepo.save(resignGame(ongoing, Date.now()));
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
        <BackButton onClick={() => void backToSetup()} label={t('changeBot')} />
        <BotGameView
          key={view.game.id}
          initial={view.game}
          onRematch={(g) =>
            void start(
              { botId: g.botId, color: g.playerColor, timeControl: g.clock.timeControl },
              null,
            )
          }
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
