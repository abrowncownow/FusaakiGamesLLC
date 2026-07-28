import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const exportRoot = resolve("out");
const contentTypes = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(
    new URL(request.url ?? "/", "http://127.0.0.1").pathname,
  );
  const relativePath = normalize(pathname).replace(/^[/\\]+/, "");
  let filePath = resolve(join(exportRoot, relativePath));
  if (!filePath.startsWith(exportRoot) || !existsSync(filePath))
    filePath = resolve(join(exportRoot, relativePath, "index.html"));
  if (existsSync(filePath) && statSync(filePath).isDirectory())
    filePath = join(filePath, "index.html");
  if (!filePath.startsWith(exportRoot) || !existsSync(filePath)) {
    response.statusCode = 404;
    filePath = join(exportRoot, "404.html");
  }
  response.setHeader(
    "Content-Type",
    contentTypes[extname(filePath)] ?? "application/octet-stream",
  );
  createReadStream(filePath).pipe(response);
});

server.listen(3000, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
