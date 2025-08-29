import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { log } from "./vite.js";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// --- Enable JSON and URL-encoded parsing ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Enable CORS ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

// --- API Logging Middleware ---
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  let capturedJsonResponse: Record<string, any> | undefined;
  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "…";
      log(logLine);
    }
  });

  next();
});

// --- Register API Routes ---
(async () => {
  const server = await registerRoutes(app);

  // --- Global Error Handler ---
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // --- Serve Frontend ---
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.join(__dirname, "../public"); 

  app.use(express.static(distPath)); // serve static files

  // SPA fallback for React Router
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // --- Start Server ---
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    log(`Backend + Frontend running on http://${host}:${port}`);
  });
})();
