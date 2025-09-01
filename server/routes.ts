import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertVinScanSchema } from "../shared/schema.js";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs"; 
import axios from "axios";
import FormData from "form-data";

const OCR_API_KEY: any = process.env.OCR_KEY;
const VALID_VIN_PREFIXES = ["MD", "1M", "2H", "3N", "5Y", "JH", "KL"];
const uploadPath = "uploads/";

// Multer storage config
const storageMulter = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => cb(null, uploadPath),
  filename: (req: Request, file: Express.Multer.File, cb) => 
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage: storageMulter });

// OCR function
async function performOcrWithApi(filePath: string, apiKey: string): Promise<string> {
  if (!apiKey || apiKey === process.env.OCR_KEY) {
    console.warn("⚠️ Using default OCR.space API key. Please replace in production.");
  }
  const formData = new FormData();
  formData.append("file", createReadStream(filePath));
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("OCREngine", "2"); // Better accuracy
  try {
    const response = await axios.post("https://api.ocr.space/parse/image", formData, {
      headers: formData.getHeaders(),
    });

    if (response.data.IsErroredOnProcessing) {
      throw new Error(`OCR API Error: ${response.data.ErrorMessage}`);
    }

    return response.data.ParsedResults[0]?.ParsedText || "";
  } catch (error) {
    console.error("❌ Axios OCR API error:", error);
    throw new Error("Failed to communicate with OCR service.");
  }
}

// Extract VIN logic
function extractVinFromText(rawText: string): string {
  const cleaned = rawText.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const vinMatches = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/g) || [];
  if (vinMatches.length === 0) return "";
  const bestMatch: any =
    vinMatches.find(v => VALID_VIN_PREFIXES.some(prefix => v.startsWith(prefix))) ||
    vinMatches[0];
  return bestMatch;
}

// Register Routes
export async function registerRoutes(app: Express): Promise<Server> {
  await fs.mkdir(uploadPath, { recursive: true });

  // --------------- MAIN OCR VIN SCAN ROUTE ----------------
  app.post("/api/scan-vin", upload.single("image"), async (req:any, res:any) => {
    if (!req.file) {
      console.log("###################",req.file.image)
      return res.status(400).json({ error: "No image uploaded" });
    }
    const filePath = path.resolve(req.file.path);

    try {
      const rawText = await performOcrWithApi(filePath, OCR_API_KEY);
      const vin = extractVinFromText(rawText);

      console.log("------ Raw OCR Text ------\n", rawText.trim());
      console.log("------ Final VIN ------\n", vin);

      if (!vin) {
        return res.status(404).json({ 
          error: "No valid 17-character VIN found in the image.", 
          rawText 
        });
      }

      // ✅ Image will remain in uploads/ folder permanently
      res.json({ vin, rawText: rawText.trim(), filePath });

    } catch (error: any) {
      console.error("Scan processing error:", error);
      res.status(500).json({ error: error.message || "OCR processing failed" });
    }
    // ❌ Do NOT delete file, so image stays in uploads/
  });

  // ---------------- Other existing API routes (unchanged) ----------------

  const httpServer = createServer(app);
  return httpServer;
}
