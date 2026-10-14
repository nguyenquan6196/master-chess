'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'use-intl';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { SaveFile, SaveFileError } from '@/core/profile/saveFile';
import type { Profile } from '@/core/profile/schema';
import { importSave, readSaveFile } from '@/services/profile/saveTransfer';

interface ImportSaveButtonProps {
  label: string;
  onImported: (profile: Profile) => void;
  variant?: 'secondary' | 'ghost';
}

/** File picker → validation → confirmation → import (spec §8.2). */
export function ImportSaveButton({ label, onImported, variant = 'ghost' }: ImportSaveButtonProps) {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<SaveFile | null>(null);
  const [error, setError] = useState<SaveFileError | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const parsed = await readSaveFile(file);
    if (input.current) input.current.value = '';
    if (parsed.ok) setPending(parsed.data);
    else setError(parsed.error);
  }

  async function confirm() {
    if (!pending) return;
    const profile = await importSave(pending);
    setPending(null);
    onImported(profile);
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <Button variant={variant} onClick={() => input.current?.click()}>
        📥 {label}
      </Button>

      <Modal
        open={pending !== null}
        title={t('import')}
        onClose={() => setPending(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {tc('cancel')}
            </Button>
            <Button variant="primary" onClick={() => void confirm()}>
              {t('import')}
            </Button>
          </>
        }
      >
        {pending && t('importConfirm', { name: pending.profile.name })}
      </Modal>

      <Modal
        open={error !== null}
        title={t('import')}
        onClose={() => setError(null)}
        actions={
          <Button variant="primary" onClick={() => setError(null)}>
            {tc('ok')}
          </Button>
        }
      >
        {error && t(`importError.${error}`)}
      </Modal>
    </>
  );
}
