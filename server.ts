import { createApp } from "./server/app";

const PORT = 3000;

async function start() {
  const app = await createApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
