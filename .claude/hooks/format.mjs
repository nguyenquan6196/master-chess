// PostToolUse hook: format + lint-fix the file Claude just edited. Never blocks the edit.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const file = input.tool_input?.file_path;
if (!file) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const rel = path.relative(root, path.resolve(file));
if (rel.startsWith('..') || /(^|[\/])(node_modules|\.next)[\/]/.test(rel)) process.exit(0);

const run = (bin, args) => {
  try {
    execFileSync(process.execPath, [path.join(root, 'node_modules', bin), ...args, rel], {
      cwd: root,
      stdio: 'ignore',
    });
  } catch {
    // Lint errors are reported by `npm run lint`; the hook only auto-fixes.
  }
};

if (/\.(ts|tsx|js|mjs|mts)$/.test(rel)) run('eslint/bin/eslint.js', ['--fix']);
if (/\.(ts|tsx|js|mjs|mts|json|css)$/.test(rel))
  run('prettier/bin/prettier.cjs', ['--write', '--log-level', 'silent']);
