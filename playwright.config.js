import { defineConfig } from "@playwright/test";
import chromium from "@sparticuz/chromium";
import { fileURLToPath } from "node:url";
process.env.DB_NAME = "chung_cu_test";
// npm-distributed browser keeps CI independent of separate browser CDN access.
const root = fileURLToPath(new URL("./", import.meta.url));
const launchOptions =
  process.platform === "linux"
    ? {
        executablePath: await chromium.executablePath(),
        args: chromium.args.filter((arg) => arg !== "--single-process"),
      }
    : {};
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    actionTimeout: 10000,
    viewport: { width: 1440, height: 1000 },
    launchOptions,
  },
  webServer: [
    {
      command: `"${process.execPath}" backend/src/server.js`,
      cwd: root,
      url: "http://127.0.0.1:3101/api/ready",
      env: { PORT: "3101", DB_NAME: "chung_cu_test" },
      reuseExistingServer: false,
    },
    {
      command: `"${process.execPath}" node_modules/vite/bin/vite.js frontend --host 127.0.0.1 --port 5174 --strictPort`,
      cwd: root,
      url: "http://127.0.0.1:5174",
      env: { API_TARGET: "http://127.0.0.1:3101" },
      reuseExistingServer: false,
    },
  ],
});
