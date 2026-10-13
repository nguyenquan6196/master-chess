import type { Locale } from './config';
import type { Messages } from './messages';

// Makes `t('some.key')` type-checked against messages/vi.json.
declare module 'use-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
