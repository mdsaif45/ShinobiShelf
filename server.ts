// Must be the first import: loads .env into process.env before any module
// (e.g. routes/auth.ts) reads GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
import "dotenv/config";
import { createApp } from "./server/app";

const PORT = 3000;

async function start() {
  const app = await createApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
