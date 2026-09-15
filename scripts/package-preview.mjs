import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const root = process.cwd();
const artifacts = resolve(root, ".artifacts");
const play = resolve(root, "out", "play");
if (
  dirname(artifacts) !== root ||
  basename(artifacts) !== ".artifacts" ||
  dirname(play) !== resolve(root, "out") ||
  basename(play) !== "play"
)
  throw new Error("Unexpected output directory.");
await readFile(resolve(root, "out", "index.html"));
await readFile(resolve(root, "apps", "game", "dist", "index.html"));
await rm(artifacts, { recursive: true, force: true });
await rm(play, { recursive: true, force: true });
await mkdir(artifacts, { recursive: true });
await cp(resolve(root, "apps", "game", "dist"), play, { recursive: true });
await writeFile(
  resolve(play, "build.json"),
  JSON.stringify(
    {
      commit: process.env.GITHUB_SHA ?? "local",
      scenario: "timber-foundation",
      version: 1,
    },
    null,
    2,
  ),
);
await cp(resolve(root, "out"), resolve(artifacts, "site"), { recursive: true });
await cp(play, resolve(artifacts, "game"), { recursive: true });
console.log(
  "Release bundles: .artifacts/site (website + /play/) and .artifacts/game (standalone scenario).",
);
