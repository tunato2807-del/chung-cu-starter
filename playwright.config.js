import { defineConfig } from "@playwright/test";
import chromium from "@sparticuz/chromium";
process.env.DB_NAME = "chung_cu_test";
// npm-distributed browser keeps CI independent of separate browser CDN access.
const executablePath = await chromium.executablePath();
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    actionTimeout: 10000,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath,
      args: chromium.args.filter((arg) => arg !== "--single-process"),
    },
  },
  webServer: [
    {
      command: "npm run start -w backend",
      url: "http://127.0.0.1:3101/api/ready",
      env: { PORT: "3101", DB_NAME: "chung_cu_test" },
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -w frontend -- --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      env: { API_TARGET: "http://127.0.0.1:3101" },
      reuseExistingServer: false,
    },
  ],
});
