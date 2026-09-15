import { buildApp } from "./app.js";

// Bind only to loopback until durable state and authentication have been implemented.
const app = buildApp();
try {
  await app.listen({ host: "127.0.0.1", port: 4310 });
  console.log(
    "Development world API: http://127.0.0.1:4310/api/health (in-memory)",
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, async () => {
    await app.close();
  });
