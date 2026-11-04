import assert from "node:assert/strict";
import http from "node:http";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer } from "vite";
import config from "../../../frontend/vite.config.js";
import { rateLimit } from "../../../backend/src/lib/http.js";

// Uses the current Vite proxy and real Express limiter, with limit=1 to keep
// the proof small. No login attempts, .env or database access are involved.
const backendIps = [],
  proxyClientIps = [];
const app = express();
app.use((req, res, next) => {
  backendIps.push(req.ip);
  next();
});
app.get("/api/review-proof", rateLimit(1, 60000), (req, res) =>
  res.json({ ok: true }),
);
app.use((error, req, res, next) =>
  res.status(error.status || 500).json({ code: error.code }),
);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
let vite;
try {
  vite = await createServer({
    ...config,
    configFile: false,
    root: fileURLToPath(new URL("../../../frontend/", import.meta.url)),
    logLevel: "silent",
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [
      {
        name: "review-observe-client",
        configureServer(s) {
          s.middlewares.use((req, res, next) => {
            if (req.url === "/api/review-proof")
              proxyClientIps.push(req.socket.remoteAddress);
            next();
          });
        },
      },
    ],
    server: {
      ...config.server,
      host: "127.0.0.1",
      port: 0,
      proxy: { "/api": `http://127.0.0.1:${server.address().port}` },
    },
  });
  await vite.listen();
  async function request(localAddress) {
    return new Promise((resolve, reject) => {
      const req = http.get(
        {
          hostname: "127.0.0.1",
          port: vite.httpServer.address().port,
          path: "/api/review-proof",
          localAddress,
          agent: false,
        },
        (res) => {
          res.resume();
          res.once("end", () => resolve(res.statusCode));
        },
      );
      req.once("error", reject);
    });
  }
  const statuses = [await request("127.0.0.2"), await request("127.0.0.3")];
  assert.notEqual(proxyClientIps[0], proxyClientIps[1]);
  assert.equal(backendIps[0], backendIps[1]);
  assert.deepEqual(statuses, [200, 429]);
  console.log(
    JSON.stringify({
      evidenceFor: "d226254",
      databaseAccess: false,
      proxyClientIps,
      backendIps,
      statuses,
    }),
  );
} finally {
  await vite?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
