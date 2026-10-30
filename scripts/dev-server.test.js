import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("frontend refuses an occupied port instead of silently changing its address", async () => {
  const occupied = http.createServer();
  let vite;
  await new Promise((resolve) => occupied.listen(0, "127.0.0.1", resolve));
  try {
    vite = await createServer({
      root: fileURLToPath(new URL("../frontend/", import.meta.url)),
      configFile: fileURLToPath(
        new URL("../frontend/vite.config.js", import.meta.url),
      ),
      logLevel: "silent",
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { host: "127.0.0.1", port: occupied.address().port },
    });
    await assert.rejects(vite.listen(), /already in use|EADDRINUSE/i);
  } finally {
    await vite?.close();
    await new Promise((resolve) => occupied.close(resolve));
  }
});
