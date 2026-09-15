import { spawn } from "node:child_process";

const pnpm = process.env.npm_execpath;
if (!pnpm) throw new Error("Start with pnpm game:dev.");
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}

for (const name of ["simulation", "server", "game"]) {
  const child = spawn(
    process.execPath,
    [pnpm, "--filter", `@fusaakigames/${name}`, "dev"],
    {
      stdio: "inherit",
      windowsHide: true,
    },
  );
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
