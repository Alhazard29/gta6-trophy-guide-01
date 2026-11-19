// Leonida Legend — GTA 6 Trophy Guide & Tracker (make.fun gta6-trophy-guide-01).
//
// Program (Node 22, standard library only) that hands the guide in: it copies
// this repository's app/ and screenshots/ into the output directory and writes
// /output/dossier.json with the vendored make.fun library, so the judge reads
// the screenshots, the first load's files and bytes, and the source.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyGuideIntoOutput() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  const shots = join(repoRoot, 'screenshots');
  if (existsSync(shots)) cpSync(shots, join(outputDir, 'screenshots'), { recursive: true });
}

function writeDossier() {
  // The scorer's own caps (see the kit's RULES.txt): text_max_bytes shapes the
  // dossier text; the other caps refuse an entry the scorer would refuse —
  // more than 4 screenshots or one over 256 KiB, more than 993 files and
  // directories in app/ or 48 MiB of app files. app/ counts beside /output's
  // own 1000-entry cap, its screenshots/ and dossier.json.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

copyGuideIntoOutput();
writeDossier();
