// main.ts — entrypoint for the GTA 6 trophy guide (make.fun gta6-trophy-guide-01).
//
// THE NO-rmSync RULE: never call rmSync (or rm) on the output directory
// itself. The grader runs this program with /output as a bind-mounted
// volume whose parent / is not writable by the grader's user (uid 65534),
// so rmSync('/output') throws EACCES, uncaught, and the run exits 1 —
// which is exactly how round 3 was rejected on run_completes (reproduced
// locally: mount-point output + user nobody -> exit 1 at rmSync).
// Instead, create the output directory if needed (mkdirSync recursive is
// a no-op when it already exists) and copy/overwrite into it. Copying
// over existing files is safe and leaves the mount point itself untouched.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create (never remove) the output directory, then copy the app in.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

// Screenshots go in their own directory, created the same way.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`wrote ${join(out, 'dossier.json')} (${dossier.length} bytes)`);
