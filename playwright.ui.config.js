import { defineConfig } from "@playwright/test";
import chromium from "@sparticuz/chromium";

export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "dialog-workflows.spec.js",
    "qr-preview.spec.js",
    "connection-recovery.spec.js",
    "gallery-upload.spec.js",
    "in-page-photo.spec.js",
    "photo-carousel.spec.js",
    "service-discovery.spec.js",
    "workspace-layout.spec.js",
  ],
  workers: 1,
  grepInvert: /@database/,
  timeout: 45000,
  reporter: "list",
  use: {
    baseURL: process.env.UI_TEST_BASE_URL,
    actionTimeout: 10000,
    viewport: { width: 1440, height: 1000 },
    launchOptions:
      process.platform === "linux"
        ? {
            executablePath: await chromium.executablePath(),
            args: chromium.args.filter((arg) => arg !== "--single-process"),
          }
        : {},
  },
});
