// Leonida Ledger — local static server for trying the guide.
// Serves app/ at its root on http://localhost:8080, standard library only.
// Usage: node serve.ts   (then open http://localhost:8080 in a browser)

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(fileURLToPath(new URL(".", import.meta.url)), "app");
const port = Number(process.env.PORT ?? 8080);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

createServer((req, res) => {
  const asked = normalize(join(appRoot, decodeURIComponent(req.url.split("?")[0])));
  const file = asked.endsWith("/") || !existsSync(asked)
    ? join(asked, "index.html")
    : asked;
  if (!file.startsWith(appRoot) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found\n");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(port, () => {
  console.log(`Leonida Ledger serving app/ at http://localhost:${port}`);
});
