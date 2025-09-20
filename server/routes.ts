import express from "express";
import fs from "fs/promises";
import { handleFileUpload } from "./fileUpload.js"; 
import { storage } from "./storage.js";
import { insertVinScanSchema } from "../shared/schema.js";
import { z } from "zod";
import { performOcrWithApi, extractVinFromText, normalizeVinChars} from "./ocrUtils.js";
import {detectScreenCapture} from './ocrUtils.js'
const OCR_API_KEY: any = "K81527619388957";
export const appRouter = express.Router();
appRouter.post("/api/scan-vin", async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    const file: any = req.files.image;
    const buffer: Buffer = file.data;
    const detection = await detectScreenCapture(buffer);
    console.log("######## SCORE:", detection.score, "Reasons:", detection.reasons);
    if (detection.isScreen) {
      return res.status(403).json({
        success: false,
        message: "❌ Fake VIN detected (captured from screen).",
        score: detection.score,
        reasons: detection.reasons,
      });
    }
    const { filePath, publicUrl } = await handleFileUpload(file);
    const rawText = await performOcrWithApi(filePath, OCR_API_KEY);
    const vin = extractVinFromText(rawText);
    if (!vin || vin.length !== 17) {
      return res.status(404).json({
        error: "No valid 17-character VIN found in the image.",
        rawText: normalizeVinChars(rawText.toUpperCase()).replace(/[^A-Z0-9]/g, ""),
      });
    }
    res.json({ vin, fileUrl: publicUrl, score: detection.score, reasons: detection.reasons });
    await fs.unlink(filePath).catch((err: any) =>
      console.error("Failed to clean up file:", err)
    );
  } catch (error: any) {
    console.error("Scan processing error:", error);
    res.status(500).json({ error: error.message || "OCR processing failed" });
  }
});
  appRouter.post("/api/users", async (req, res) => {
  try {
    const { email, firstName, lastName, role, password } = req?.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "All fields are required" });
    }
      const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }
    let profileImageUrl: any | null = null;
    if (req.files && (req.files as any).profileImage) {
      profileImageUrl = await handleFileUpload((req.files as any).profileImage);
    }
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
  appRouter.get("/api/auth/user", async (req, res) => {
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
  appRouter.post("/api/scans", async (req, res) => {
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
  appRouter.get("/api/scans", async (req, res) => {
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
  appRouter.get("/api/scans/:id", async (req, res) => {
    try {
      const scan = await storage.getVinScanById(req.params.id);
      if (!scan) return res.status(404).json({ message: "Scan not found" });
      res.json(scan);
    } catch (error) {
      console.error("Error fetching scan:", error);
      res.status(500).json({ message: "Failed to fetch scan" });
    }
  });
  appRouter.put("/api/scans/:id", async (req, res) => {
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
  appRouter.delete("/api/scans/:id", async (req, res) => {
    try {
      const success = await storage.deleteVinScan(req.params.id);
      if (!success) return res.status(404).json({ message: "Scan not found" });
      res.json({ message: "Scan deleted successfully" });
    } catch (error) {
      console.error("Error deleting scan:", error);
      res.status(500).json({ message: "Failed to delete scan" });
    }
  });
  appRouter.delete("/api/scans", async (req, res) => {
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
  appRouter.get("/api/stats/user", async (req, res) => {
    try {
      const userId = "public_access_user_id";
      const stats = await storage.getUserScanStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  appRouter.get("/api/stats/admin", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
appRouter.post("/api/local-login", async (req, res) => {
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

appRouter.get("/get-vin-details/:vin", async (req: any, res: any) => {
  const vinScanId = req.params.vin; 
  if (!vinScanId) {
    return res.status(400).json({ message: "VIN scan ID is required" });
  }
  try {
    const vinData =await storage?.getVinScanByVin(vinScanId);
    if (!vinData) {
      return res.status(404).json({ message: "VIN not found" });
    }
    return res.status(200).json(vinData);
  } catch (err) {
    console.error("Error fetching VIN details:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
