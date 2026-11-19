// Leonida Legend — GTA VI trophy guide: the entry program.
//
// Copies app/ and screenshots/ from this repository into the output
// directory, then writes dossier.json there with buildDossier from
// vendor/makefun-frontend.ts. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output. Node 22, standard library only. The program
// runs twice and writes the same bytes both times: it wipes the output
// trees it owns before copying, and buildDossier is deterministic.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const appOut = join(outputDir, 'app');
const shotsOut = join(outputDir, 'screenshots');

mkdirSync(outputDir, { recursive: true });
rmSync(appOut, { recursive: true, force: true });
rmSync(shotsOut, { recursive: true, force: true });

cpSync(join(repoRoot, 'app'), appOut, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsOut, { recursive: true });
}

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000
  })
);
