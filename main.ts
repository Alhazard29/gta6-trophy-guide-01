// Entry point for the GTA 6 trophy guide: hands the guide in by copying
// app/ and screenshots/ from this repository into the output directory and
// writing /output/dossier.json with buildDossier from the kit's frontend
// library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
//
// Run it with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the directory this file lives in.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// The grader gives us a writable /output; a local run overrides it.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the scorer hands buildDossier: the dossier text budget, the
// screenshot limits (4 images, 256 KiB each), and the app/ limits (993
// files, 16 MiB, paths of at most 1,000 bytes).
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
  app_path_max_bytes: 1000,
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const name of ['app', 'screenshots']) {
  cpSync(join(repoRoot, name), join(outDir, name), { recursive: true });
}

const dossier = buildDossier(outDir, dossierCaps);
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
