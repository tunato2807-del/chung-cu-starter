import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import base from "./vite.config.js";

function certificate(variable, filename) {
  const path =
    process.env[variable] ||
    fileURLToPath(new URL(`../.certs/${filename}`, import.meta.url));
  try {
    return readFileSync(path);
  } catch {
    throw new Error(
      `Chưa đọc được chứng chỉ HTTPS: ${path}. Làm theo docs/https-local.md trước khi chạy dev:frontend:https.`,
    );
  }
}

export default mergeConfig(base, {
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    https: {
      cert: certificate("DEV_HTTPS_CERT", "dev-cert.pem"),
      key: certificate("DEV_HTTPS_KEY", "dev-key.pem"),
    },
  },
});
