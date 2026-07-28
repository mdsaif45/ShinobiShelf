import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import authRouter from "./routes/auth";
import booksRouter from "./routes/books";
import loansRouter from "./routes/loans";
import usersRouter from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";

export async function createApp() {
  const app = express();
  
  app.use(express.json());

  // Health Check Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // REST API Endpoints
  app.use("/api/auth", authRouter);
  app.use("/api/books", booksRouter);
  app.use("/api/loans", loansRouter);
  app.use("/api/users", usersRouter);

  // OAuth Callback Popup Handler
  app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
    const code = req.query.code;
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #faf8f5;">
          <div style="text-align: center; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h3 style="color: #3b4e2d; margin-top: 0;">Google Authentication Successful</h3>
            <p style="color: #666;">Completing sign-in and closing popup...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: ${JSON.stringify(code || '')} }, '*');
              setTimeout(() => { window.close(); }, 800);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  });

  // Global Error Handler Middleware
  app.use(errorHandler);

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          const base = path.basename(filePath);
          // The service worker and manifest must never be served from cache:
          // a stale sw.js pins users to an old build indefinitely, because the
          // browser checks this exact URL to discover updates.
          if (base === 'sw.js' || base === 'manifest.webmanifest') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );

    // SPA fallback. Restricted to navigations so a missing asset returns 404
    // instead of HTML — a JS or JSON request answered with index.html surfaces
    // as a confusing parse error rather than a clear missing-file error.
    app.get('*', (req, res, next) => {
      if (req.method !== 'GET' || !req.accepts('html')) return next();
      if (path.extname(req.path)) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
