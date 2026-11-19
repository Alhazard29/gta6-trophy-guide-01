// GTA 6 Trophy Guide — the entrypoint that hands the guide in.
//
// It takes the static app and the screenshots from beside this file, puts
// them in the output directory, and writes the dossier that buildDossier
// computes from them. Node 22, standard library only: nothing is installed,
// nothing is built, and the same input always writes the same bytes.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The grader hands us /output; outside it MAKEFUN_OUTPUT_DIR stands in.
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// This file sits at the repository root, so the app and the screenshots live
// beside it.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// The bounty's caps: the dossier text is 160 KiB, screenshots are 3 or 4
// images of at most 256 KiB, and the app is at most 993 entries and 16 MiB.
// Only the text cap shapes the bytes; the rest only refuse, so these match
// the gate and the entry fails here exactly where the scorer would refuse it.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

// Start from an empty output directory, so a second run writes the same
// bytes as the first instead of leaving a stale file behind.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Hand in the app and its screenshots. Either one missing is buildDossier's
// refusal to report, not a copy error, so only copy what is there.
if (existsSync(join(repoRoot, 'app'))) {
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
}
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The dossier, built from the output directory exactly as the scorer builds it.
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, caps));
