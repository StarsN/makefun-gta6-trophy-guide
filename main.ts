// Leonida Ledger — the entry program for the GTA 6 trophy guide bounty.
// Node 22, standard library only. It takes the guide as built (app/ plus
// screenshots/) and hands it in: both folders are copied into the output
// directory, and dossier.json is written there with the make.fun frontend
// library vendored at vendor/makefun-frontend.ts. That vendored file is the
// kit's copy and must stay byte for byte as shipped.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const MAX_SCREENSHOT_BYTES = 262144;

function copyFolder(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return 0;
  cpSync(from, join(outDir, name), { recursive: true });
  return readdirSync(from).length;
}

mkdirSync(outDir, { recursive: true });
const appCount = copyFolder("app");
mkdirSync(join(outDir, "screenshots"), { recursive: true });
const shotCount = copyFolder("screenshots");
if (appCount === 0) throw new Error("app/ is missing from the repository");
if (shotCount === 0) throw new Error("screenshots/ is missing from the repository");

// Screenshots are part of the hand-in: 3 or 4 of them, each a real render of
// the guide, each at most 256 KiB. Check the counts here so a bad set fails
// loudly before buildDossier runs, instead of failing inside it.
const shotFiles = readdirSync(join(outDir, "screenshots")).filter((f) => !f.startsWith("."));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shotFiles.length}`);
}
for (const file of shotFiles) {
  const { size } = statSync(join(outDir, "screenshots", file));
  if (size > MAX_SCREENSHOT_BYTES) {
    throw new Error(`screenshot ${file} is ${size} bytes, over the 256 KiB cap`);
  }
}

// The gate's own caps for this bounty: at most 4 screenshots of 256 KiB,
// app/ at most 993 files and directories and 48 MiB, dossier text at most
// 160 KiB. buildDossier refuses anything past them, so a bad build fails
// here instead of silently handing in a broken dossier.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(
  `Leonida Ledger handed in: ${appCount} app entries, ${shotFiles.length} screenshots, dossier ${dossier.length} bytes -> ${outDir}`,
);
