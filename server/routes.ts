import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVinScanSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {

  app.post('/api/users', async (req: any, res) => {
    try {
      const { id, email, firstName, lastName, role } = req.body;
      const user = await storage.upsertUser({
        id,
        email,
        firstName,
        lastName,
        role: role || 'user'
      });
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  // Auth routes are now public and return a placeholder user
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Since there is no authentication, we'll return a placeholder user
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

  // VIN Scan routes - all are now publicly accessible
  app.post('/api/scans', async (req: any, res) => {
    try {
      const userId = "public_access_user_id"; // No authentication, using a placeholder
      const scanData = insertVinScanSchema.parse({
        ...req.body,
        userId,
      });

      const scan = await storage.createVinScan(scanData);
      res.json(scan);
    } catch (error) {
      console.error("Error creating scan:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create scan" });
      }
    }
  });

  app.get('/api/scans', async (req: any, res) => {
    try {
      // Fetching all scans as there is no user-based restriction
      const { userId, vinNumber, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
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

  app.get('/api/scans/:id', async (req: any, res) => {
    try {
      const scan = await storage.getVinScanById(req.params.id);

      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      // No permission checks, as all access is public
      res.json(scan);
    } catch (error) {
      console.error("Error fetching scan:", error);
      res.status(500).json({ message: "Failed to fetch scan" });
    }
  });

  app.put('/api/scans/:id', async (req: any, res) => {
    try {
      // No admin check, all access is public
      const updateData = insertVinScanSchema.partial().parse(req.body);
      const scan = await storage.updateVinScan(req.params.id, updateData);

      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }

      res.json(scan);
    } catch (error) {
      console.error("Error updating scan:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update scan" });
      }
    }
  });

  app.delete('/api/scans/:id', async (req: any, res) => {
    try {
      // No admin check, all access is public
      const success = await storage.deleteVinScan(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Scan not found" });
      }

      res.json({ message: "Scan deleted successfully" });
    } catch (error) {
      console.error("Error deleting scan:", error);
      res.status(500).json({ message: "Failed to delete scan" });
    }
  });

  app.delete('/api/scans', async (req: any, res) => {
    try {
      // No admin check, all access is public
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "IDs array is required" });
      }

      const deletedCount = await storage.deleteVinScans(ids);
      res.json({ message: `${deletedCount} scans deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting scans:", error);
      res.status(500).json({ message: "Failed to delete scans" });
    }
  });

  // Statistics routes are also public now
  app.get('/api/stats/user', async (req: any, res) => {
    try {
      const userId = "public_access_user_id"; // No authentication
      const stats = await storage.getUserScanStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get('/api/stats/admin', async (req: any, res) => {
    try {
      // No admin check, returning all stats for public access
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
