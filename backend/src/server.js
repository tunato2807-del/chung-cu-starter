import { app } from "./app.js";
import { pool } from "./lib/db.js";
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error(
    "JWT_SECRET must contain at least 32 characters. Run npm run init:local.",
  );
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`API: http://127.0.0.1:${port}/api/health`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
