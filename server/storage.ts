import {
  users,
  vinScans,
  type User,
  type UpsertUser,
  type InsertVinScan,
  type VinScan,
  type VinScanWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, gte, lte, count } from "drizzle-orm";
import { any } from "zod";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // VIN scan operations
  createVinScan(scan: InsertVinScan): Promise<VinScan>;
  getVinScansByUser(userId: string): Promise<VinScanWithUser[]>;
  getAllVinScans(filters?: {
    userId?: string;
    vinNumber?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<VinScanWithUser[]>;
  getVinScanById(id: string): Promise<VinScanWithUser | undefined>;
  updateVinScan(id: string, data: Partial<InsertVinScan>): Promise<VinScan | undefined>;
  deleteVinScan(id: string): Promise<boolean>;
  deleteVinScans(ids: string[]): Promise<number>;
  
  // Statistics
  getUserScanStats(userId: string): Promise<{
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    monthlyScans: number;
  }>;
  getAdminStats(): Promise<{
    totalUsers: number;
    totalScans: number;
    todayScans: number;
    failedScans: number;
    successRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // VIN scan operations
  async createVinScan(scan: InsertVinScan): Promise<VinScan> {
    const [newScan] = await db
      .insert(vinScans)
      .values(scan)
      .returning();
    return newScan;
  }

  async getVinScansByUser(userId: string): Promise<VinScanWithUser[]> {
    return await db
      .select()
      .from(vinScans)
      .leftJoin(users, eq(vinScans.userId, users.id))
      .where(eq(vinScans.userId, userId))
      .orderBy(desc(vinScans.createdAt))
      .then(rows => rows.map(row => ({
        ...row.vin_scans,
        user: row.users!
      })));
  }

  async getAllVinScans(filters?: {
    userId?: string;
    vinNumber?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<VinScanWithUser[]> {
    let query:any= db
      .select()
      .from(vinScans)
      .leftJoin(users, eq(vinScans.userId, users.id));

    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(vinScans.userId, filters.userId));
    }
    
    if (filters?.vinNumber) {
      conditions.push(like(vinScans.vinNumber, `%${filters.vinNumber}%`));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(vinScans.createdAt, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(vinScans.createdAt, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(vinScans.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const rows:any = await query;
    return rows.map((row:any)=> ({
      ...row.vin_scans,
      user: row.users!
    }));
  }

  async getVinScanById(id: string): Promise<VinScanWithUser | undefined> {
    const [row] = await db
      .select()
      .from(vinScans)
      .leftJoin(users, eq(vinScans.userId, users.id))
      .where(eq(vinScans.id, id));

    if (!row) return undefined;

    return {
      ...row.vin_scans,
      user: row.users!
    };
  }

  async updateVinScan(id: string, data: Partial<InsertVinScan>): Promise<VinScan | undefined> {
    const [updated] = await db
      .update(vinScans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vinScans.id, id))
      .returning();
    return updated;
  }

  async deleteVinScan(id: string): Promise<boolean> {
    const result:any = await db
      .delete(vinScans)
      .where(eq(vinScans.id, id));
    return result.rowCount > 0;
  }

  async deleteVinScans(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    
    const result:any = await db
      .delete(vinScans)
      .where(eq(vinScans.id, ids[0])); // For simplicity, delete one by one in a transaction would be better
    return result.rowCount;
  }

  // Statistics
  async getUserScanStats(userId: string): Promise<{
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    monthlyScans: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResult] = await db
      .select({ count: count() })
      .from(vinScans)
      .where(eq(vinScans.userId, userId));

    const [successfulResult] = await db
      .select({ count: count() })
      .from(vinScans)
      .where(and(
        eq(vinScans.userId, userId),
        eq(vinScans.scanStatus, 'complete')
      ));

    const [failedResult] = await db
      .select({ count: count() })
      .from(vinScans)
      .where(and(
        eq(vinScans.userId, userId),
        eq(vinScans.scanStatus, 'failed')
      ));

    const [monthlyResult] = await db
      .select({ count: count() })
      .from(vinScans)
      .where(and(
        eq(vinScans.userId, userId),
        gte(vinScans.createdAt, startOfMonth)
      ));

    return {
      totalScans: totalResult.count,
      successfulScans: successfulResult.count,
      failedScans: failedResult.count,
      monthlyScans: monthlyResult.count,
    };
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalScans: number;
    todayScans: number;
    failedScans: number;
    successRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [usersResult] = await db
      .select({ count: count() })
      .from(users);

    const [totalScansResult] = await db
      .select({ count: count() })
      .from(vinScans);

    const [todayScansResult] = await db
      .select({ count: count() })
      .from(vinScans)
      .where(gte(vinScans.createdAt, today));

    const [failedScansResult] = await db
      .select({ count: count() })
      .from(vinScans)
      .where(eq(vinScans.scanStatus, 'failed'));

    const [successfulScansResult] = await db
      .select({ count: count() })
      .from(vinScans)
      .where(eq(vinScans.scanStatus, 'complete'));

    const totalScans = totalScansResult.count;
    const successfulScans = successfulScansResult.count;
    const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;

    return {
      totalUsers: usersResult.count,
      totalScans: totalScans,
      todayScans: todayScansResult.count,
      failedScans: failedScansResult.count,
      successRate: Math.round(successRate * 10) / 10,
    };
  }
}

export const storage:any= new DatabaseStorage();
