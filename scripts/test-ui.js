import { createServer } from "vite";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const server = await createServer({
  root: fileURLToPath(new URL("../frontend", import.meta.url)),
  configFile: fileURLToPath(
    new URL("../frontend/vite.config.js", import.meta.url),
  ),
  envDir: false,
  plugins: [
    {
      name: "ui-test-api-boundary",
      configureServer(vite) {
        vite.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith("/api/")) return next();
          const anonymous = req.url.split("?")[0] === "/api/xac_thuc/toi";
          res.statusCode = anonymous ? 401 : 503;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: {
                code: anonymous ? "UNAUTHORIZED" : "UI_FIXTURE_MISSING",
                message: anonymous
                  ? "Vui lòng đăng nhập."
                  : "Chưa khai báo fixture cho yêu cầu kiểm thử UI.",
              },
            }),
          );
        });
      },
    },
  ],
  server: { host: "127.0.0.1", port: 5178, strictPort: false },
});
try {
  await server.listen();
  const address = server.httpServer.address();
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
      ),
      "test",
      "--config",
      "playwright.ui.config.js",
      ...process.argv.slice(2),
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        UI_TEST_BASE_URL: `http://127.0.0.1:${address.port}`,
      },
      stdio: "inherit",
    },
  );
  process.exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  await server.close();
}
