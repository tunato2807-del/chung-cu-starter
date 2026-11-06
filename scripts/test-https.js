import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const dir = await mkdtemp(path.join(os.tmpdir(), "chung-cu-https-"));
const openssl = (...args) =>
  execFileSync("openssl", args, { cwd: dir, stdio: "ignore" });
let vite;
const api = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/api/xac_thuc/dang_nhap") {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      // Transport fixture only; no actual credentials, database or auth state.
      const valid =
        req.method === "POST" &&
        req.headers["x-app-request"] === "1" &&
        req.headers["content-type"] === "application/json" &&
        body === JSON.stringify({ probe: "https-login-transport" });
      res.statusCode = valid ? 200 : 400;
      if (valid)
        res.setHeader(
          "Set-Cookie",
          "transport_probe=fixture; Path=/; HttpOnly; Secure; SameSite=Strict",
        );
      res.end(
        JSON.stringify({
          data: { status: valid ? "login-proxy-ok" : "invalid-probe" },
        }),
      );
    });
    return;
  }
  res.end(JSON.stringify({ data: { status: "proxy-ok", path: req.url } }));
});
const variables = ["API_TARGET", "DEV_HTTPS_CERT", "DEV_HTTPS_KEY"];
const previous = Object.fromEntries(
  variables.map((name) => [name, process.env[name]]),
);
try {
  openssl(
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    "ca.key",
    "-out",
    "ca.pem",
    "-days",
    "1",
    "-subj",
    "/CN=Chung Cu Temporary Test CA",
  );
  openssl(
    "req",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    "server.key",
    "-out",
    "server.csr",
    "-subj",
    "/CN=localhost",
  );
  await writeFile(
    path.join(dir, "extensions.cnf"),
    "basicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:localhost,IP:127.0.0.1\n",
  );
  openssl(
    "x509",
    "-req",
    "-in",
    "server.csr",
    "-CA",
    "ca.pem",
    "-CAkey",
    "ca.key",
    "-CAcreateserial",
    "-out",
    "server.pem",
    "-days",
    "1",
    "-extfile",
    "extensions.cnf",
  );
  await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
  process.env.API_TARGET = `http://127.0.0.1:${api.address().port}`;
  process.env.DEV_HTTPS_CERT = path.join(dir, "server.pem");
  process.env.DEV_HTTPS_KEY = path.join(dir, "server.key");
  const portProbe = http.createServer();
  await new Promise((resolve) => portProbe.listen(0, "127.0.0.1", resolve));
  const httpsPort = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));
  vite = await createServer({
    root: fileURLToPath(new URL("../frontend/", import.meta.url)),
    configFile: fileURLToPath(
      new URL("../frontend/vite.https.config.js", import.meta.url),
    ),
    logLevel: "error",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: {
      host: "127.0.0.1",
      port: httpsPort,
      strictPort: true,
      preTransformRequests: false,
    },
  });
  await vite.listen();
  const origin = `https://127.0.0.1:${vite.httpServer.address().port}`;
  const ca = await readFile(path.join(dir, "ca.pem"));
  const get = (pathname, trustedCa) =>
    new Promise((resolve, reject) => {
      https
        .get(origin + pathname, { ca: trustedCa, agent: false }, (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve({ status: res.statusCode, body }));
        })
        .on("error", reject);
    });
  await assert.rejects(get("/"), (error) =>
    [
      "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
      "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
      "SELF_SIGNED_CERT_IN_CHAIN",
    ].includes(error.code),
  );
  const html = await get("/", ca);
  assert.equal(html.status, 200);
  assert.match(html.body, /id="root"/);
  const entry = await get("/src/main.jsx", ca);
  assert.equal(entry.status, 200);
  assert.match(entry.body, /createRoot/);
  const proxied = await get("/api/probe", ca);
  assert.equal(proxied.status, 200);
  assert.deepEqual(JSON.parse(proxied.body), {
    data: { status: "proxy-ok", path: "/api/probe" },
  });
  const loginBody = JSON.stringify({ probe: "https-login-transport" });
  const login = await new Promise((resolve, reject) => {
    const request = https.request(
      origin + "/api/xac_thuc/dang_nhap",
      {
        method: "POST",
        ca,
        agent: false,
        headers: {
          "X-App-Request": "1",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(loginBody),
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            body,
            cookies: response.headers["set-cookie"],
          }),
        );
        response.on("error", reject);
      },
    );
    request.on("error", reject);
    request.end(loginBody);
  });
  assert.equal(login.status, 200);
  assert.deepEqual(JSON.parse(login.body), {
    data: { status: "login-proxy-ok" },
  });
  assert.deepEqual(login.cookies, [
    "transport_probe=fixture; Path=/; HttpOnly; Secure; SameSite=Strict",
  ]);
  console.log(
    "PASS: HTTPS certificate trust, frontend content, API GET and login-shaped POST/cookie proxy (transport fixtures only).",
  );
} finally {
  await vite?.close();
  api.closeAllConnections();
  await new Promise((resolve) => api.close(resolve));
  for (const name of variables)
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  await rm(dir, { recursive: true, force: true });
}
