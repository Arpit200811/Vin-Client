import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import dotenv from "dotenv";
import path from "path";
import { setupVite, serveStatic, log } from "./vite";
import { fileURLToPath } from "url";
import cors from "cors";

dotenv.config();

const app = express();

// Enable JSON and URL-encoded parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Determine __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
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

  // --- Vite / Static Setup ---
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Production: serve built frontend
    serveStatic(app, path.join(__dirname, "dist/public"));
  }

  // --- Start Server ---
  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    log(`Server running on http://${host}:${port}`);
  });
})();
