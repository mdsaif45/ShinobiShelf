// Must be the first import: loads .env into process.env before any module
// (e.g. routes/auth.ts) reads GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
import "dotenv/config";
import { createApp } from "./server/app";

import os from "os";

// Hosting platforms (Render, Railway, Fly, Heroku) assign the port via the
// environment; a hardcoded value fails to bind there.
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

function getNetworkIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

async function start() {
  const app = await createApp();
  app.listen(PORT, HOST, () => {
    const networkIp = getNetworkIp();
    console.log(`\n  Server running at:`);
    console.log(`  - Local:   http://localhost:${PORT}`);
    if (networkIp) {
      console.log(`  - Network: http://${networkIp}:${PORT}`);
    }
    console.log();
  });
}

start();

