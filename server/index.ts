import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
// import { registerRoutes } from "./routes.js";
import fileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import { appRouter } from "./routes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload()
);
// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((req, res, next) => {
  const start = Date.now();
  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson, ...args) {
    res.locals.bodyJson = bodyJson;
    return originalResJson(bodyJson, ...args);
  };
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      const logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms :: ${JSON.stringify(res.locals.bodyJson)}`;
      console.log(logLine.length > 120 ? logLine.slice(0, 119) + "…" : logLine);
    }
  });
  next();
});
(async () => {
  app.use(appRouter)

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Serve frontend
  const distPath = path.resolve("dist/public");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  app.listen(port, host, () => {
    console.log(`Backend + Frontend running on http://${host}:${port}`);
  });
})();
