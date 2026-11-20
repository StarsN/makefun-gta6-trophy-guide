// Vice Trophy Atlas — the hand-in program (Node 22, standard library only).
//
// It assembles the entry in /output: the whole app/ folder and screenshots/ copied
// across, then /output/dossier.json written by the vendored make.fun library, which
// is the summary the judge reads (screenshots, first-load files and bytes, source).
// vendor/makefun-frontend.ts stays exactly as the kit handed it out: the scorer
// rebuilds the dossier with its own copy and compares the two byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outDir, { recursive: true });
cpSync(join(root, "app"), join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });
if (existsSync(join(root, "screenshots"))) {
  cpSync(join(root, "screenshots"), join(outDir, "screenshots"), { recursive: true });
}

// The caps mirror the scorer's own: at most 4 screenshots, each at most 256 KiB;
// at most 993 files and directories in app/ and 48 MiB of app files in all; the
// dossier text is capped at 160 KiB.
writeFileSync(
  join(outDir, "dossier.json"),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
