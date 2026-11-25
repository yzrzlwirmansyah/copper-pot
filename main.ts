// main.ts — The Copper Pot's hand-in program (Node 22, standard library only).
// Copies game/ and screenshots/ from this repository to /output (or
// MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with buildDossier from vendor/makefun-game.ts (the kit's copy, unchanged).
//
// Hard-won rule: NEVER delete the output directory. The grader mounts
// /output, and removing it throws EBUSY and rejects the entry. Files are
// copied over whatever is there; nothing is removed.
import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = new URL('.', import.meta.url).pathname;
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Copy a directory tree, file by file. Creates directories as needed and
// overwrites files in place; never removes anything from the destination.
function copyTree(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(src, dest);
    } else if (entry.isFile()) {
      copyFileSync(src, dest);
    }
    // Anything else (a symlink, a socket) is not part of this entry:
    // game/ must hold plain files only, and buildDossier refuses the rest.
  }
}

function main(): void {
  const gameSrc = join(REPO_ROOT, 'game');
  const shotsSrc = join(REPO_ROOT, 'screenshots');
  if (!statSync(gameSrc).isDirectory()) throw new Error('game/: no such directory in this repository');
  if (!statSync(shotsSrc).isDirectory()) throw new Error('screenshots/: no such directory in this repository');

  mkdirSync(OUT_DIR, { recursive: true });
  copyTree(gameSrc, join(OUT_DIR, 'game'));
  copyTree(shotsSrc, join(OUT_DIR, 'screenshots'));

  // buildDossier reads back exactly what was copied, so the dossier always
  // describes the output it sits beside. Its bytes are deterministic: two
  // runs over the same tree write the same dossier.
  const dossier = buildDossier(OUT_DIR, CAPS);
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);
}

main();
