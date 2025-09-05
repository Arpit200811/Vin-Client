import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import axios from "axios";
import FormData from "form-data";
import { storage } from "./storage.js"; // Your storage module
import { insertVinScanSchema } from "../shared/schema.js"; // Zod schema
import { handleFileUpload } from "./fileUpload";
import { z } from "zod";
import { error } from "console";

const OCR_API_KEY: any = process.env.OCR_KEY;
const VALID_VIN_PREFIXES = ["MD", "1M", "2H", "3N", "5Y", "JH", "KL"];
const uploadPath = "uploads/";
const storageMulter = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => cb(null, uploadPath),
  filename: (req: Request, file: Express.Multer.File, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage: storageMulter });
async function performOcrWithApi(filePath: string, apiKey: string): Promise<string> {
  console.log("DEBUG: Key being used by API:", apiKey);
  if (!apiKey || apiKey === process.env.OCR_KEY) {
    console.warn("Using a public OCR.space API key. Please replace it for production use.");
  }
  const formData = new FormData();
  formData.append("file", createReadStream(filePath));
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("OCREngine", "2");
  try {
    const response = await axios.post("https://api.ocr.space/parse/image", formData, {
      headers: formData.getHeaders(),
    });
    if (response.data.IsErroredOnProcessing) {
      throw new Error(`OCR API Error: ${response.data.ErrorMessage}`);
    }
    return response.data.ParsedResults[0]?.ParsedText || "";
  } catch (error) {
    console.error("Axios request to OCR API failed:", error);
    throw new Error("Failed to communicate with OCR service.");
  }
}
function normalizeVinChars(text: string): string {
  const map: Record<string, string> = {
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M",
    "Н": "H", "О": "O", "Р": "P", "С": "S", "Т": "T",
    "У": "Y", "Х": "X",
  };
  return text.replace(/[А-Я]/g, char => map[char] || char);
}
function extractVinFromText(rawText: string): string {
  const normalized = normalizeVinChars(rawText.toUpperCase());
  const cleaned = normalized.replace(/[^A-Z0-9]/g, "");
  const vinMatches = cleaned.match(/[A-Z0-9]{17}/g) || [];
  if (vinMatches.length === 0) return "";
  const bestMatch: any =
    vinMatches.find(v => VALID_VIN_PREFIXES.some(prefix => v.startsWith(prefix))) ||
    vinMatches[0];
  return bestMatch;
}
export async function registerRoutes(app: Express): Promise<Server> {
  await fs.mkdir(uploadPath, { recursive: true });
  app.post("/api/scan-vin", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    const filePath = path.resolve(req.file.path);
    try {
      const rawText = await performOcrWithApi(filePath, OCR_API_KEY);
      const vin = extractVinFromText(rawText);
      if (!vin || vin.length !== 17) {
        return res.status(404).json({
          error: "No valid 17-character VIN found in the image.",
          rawText: normalizeVinChars(rawText.toUpperCase()).replace(/[^A-Z0-9]/g, ""),
        });
      }
      res.json({ vin });
    } catch (error: any) {
      console.error("Scan processing error:", error);
      res.status(500).json({ error: error.message || "OCR processing failed" });
    } finally {
      try {
        // await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error("Failed to clean up file:", cleanupError);
      }
    }
  });
  app.post("/api/users", async (req, res) => {
  try {
    const { email, firstName, lastName, role, password } = req?.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Handle file upload
    let profileImageUrl: string | null = null;
    if (req.files && (req.files as any).profileImage) {
      profileImageUrl = await handleFileUpload((req.files as any).profileImage);
    }

    // Create new user (store password as plain text)
    const user = await storage.upsertUser({
      email,
      firstName,
      lastName,
      role: role || "user",
      password,
      profileImageUrl,
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

  app.get("/api/auth/user", async (req, res) => {
    try {
      const user = {
        id: "public_access_user_id",
        email: "public@example.com",
        firstName: "Public",
        lastName: "User",
        role: "guest",
      };
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app.post("/api/scans", async (req, res) => {
    try {
      const userId = "public_access_user_id";
      const scanData = insertVinScanSchema.parse({ ...req.body, userId });
      const scan = await storage.createVinScan(scanData);
      res.json(scan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Error creating scan:", error);
        res.status(500).json({ message: "Failed to create scan" });
      }
    }
  });

  app.get("/api/scans", async (req, res) => {
    try {
      const { userId, vinNumber, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
      const filters: { [key: string]: any } = {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      };
      if (userId) filters.userId = userId as string;
      if (vinNumber) filters.vinNumber = vinNumber as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      const scans = await storage.getAllVinScans(filters);
      res.json(scans);
    } catch (error) {
      console.error("Error fetching scans:", error);
      res.status(500).json({ message: "Failed to fetch scans" });
    }
  });

  app.get("/api/scans/:id", async (req, res) => {
    try {
      const scan = await storage.getVinScanById(req.params.id);
      if (!scan) return res.status(404).json({ message: "Scan not found" });
      res.json(scan);
    } catch (error) {
      console.error("Error fetching scan:", error);
      res.status(500).json({ message: "Failed to fetch scan" });
    }
  });

  app.put("/api/scans/:id", async (req, res) => {
    try {
      const updateData = insertVinScanSchema.partial().parse(req.body);
      const scan = await storage.updateVinScan(req.params.id, updateData);
      if (!scan) return res.status(404).json({ message: "Scan not found" });
      res.json(scan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Error updating scan:", error);
        res.status(500).json({ message: "Failed to update scan" });
      }
    }
  });

  app.delete("/api/scans/:id", async (req, res) => {
    try {
      const success = await storage.deleteVinScan(req.params.id);
      if (!success) return res.status(404).json({ message: "Scan not found" });
      res.json({ message: "Scan deleted successfully" });
    } catch (error) {
      console.error("Error deleting scan:", error);
      res.status(500).json({ message: "Failed to delete scan" });
    }
  });

  app.delete("/api/scans", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ message: "IDs array is required" });
      const deletedCount = await storage.deleteVinScans(ids);
      res.json({ message: `${deletedCount} scans deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting scans:", error);
      res.status(500).json({ message: "Failed to delete scans" });
    }
  });

  // -------- Statistics Routes --------
  app.get("/api/stats/user", async (req, res) => {
    try {
      const userId = "public_access_user_id";
      const stats = await storage.getUserScanStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/stats/admin", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

app.post("/api/local-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const user = await storage.getUserByEmailAndPassword(email, password);
    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    res.status(200).json({ message: "Login successful", user,status:200,success:true,error:false });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});
  const httpServer = createServer(app);
  return httpServer;
}
