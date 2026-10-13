// Verifies every locale file has exactly the same keys as messages/vi.json (the source of truth).
import { readFileSync } from 'node:fs';

const LOCALES = ['vi', 'en', 'ja'];
const SOURCE = 'vi';

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const keysOf = (locale) =>
  new Set(flatten(JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))));

const source = keysOf(SOURCE);
let failed = false;

for (const locale of LOCALES.filter((l) => l !== SOURCE)) {
  const keys = keysOf(locale);
  const missing = [...source].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !source.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ messages/${locale}.json`);
    for (const k of missing) console.error(`  missing: ${k}`);
    for (const k of extra) console.error(`  extra:   ${k}`);
  }
}

if (failed) process.exit(1);
console.log(`✓ i18n keys in sync (${source.size} keys × ${LOCALES.length} locales)`);
