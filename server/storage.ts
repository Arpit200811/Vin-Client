import {
  users,
  vinScans,
  type User,
  type UpsertUser,
  type InsertVinScan,
  type VinScan,
  type VinScanWithUser,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, and, like, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  getUserByEmailAndPassword(email: any, password: any): unknown;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // VIN scan operations
  createVinScan(scan: InsertVinScan): Promise<VinScan>;
  getVinScansByUser(userId: string): Promise<VinScanWithUser[]>;
  getVinScanByVin(vin: string): Promise<VinScanWithUser | undefined>;
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

async getUserByEmail(email: string,): Promise<User | undefined> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      password: users.password,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.email, email));
  return user;
}

async  getUserByEmailAndPassword(email: string, password: any): Promise<User | undefined> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      password: users.password,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.email, email));

  if (!user) return undefined;
  if (user.password !== password) return undefined;
  return { ...user, password: undefined } as any;
}


  async upsertUser(userData: UpsertUser & { password?: string }): Promise<User> {
  const [user] = await db
    .insert(users)
    .values(userData)
    .onConflictDoUpdate({
      target: users.id,
      set: { ...userData, updatedAt: new Date() },
    })
    .returning();
  return user;
}

  // VIN scan operations
  async createVinScan(scan: InsertVinScan): Promise<VinScan> {
    const [newScan] = await db.insert(vinScans).values(scan).returning();
    return newScan;
  }

  async getVinScansByUser(userId: string): Promise<VinScanWithUser[]> {
    const rows = await db
      .select()
      .from(vinScans)
      .leftJoin(users, eq(vinScans.userId, users.id))
      .where(eq(vinScans.userId, userId))
      .orderBy(desc(vinScans.createdAt));

    return rows.map(row => ({
      ...row.vin_scans,
      user: row.users!,
    }));
  }

  async getAllVinScans(filters?: {
    userId?: string;
    vinNumber?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<VinScanWithUser[]> {
    let query: any = db.select().from(vinScans).leftJoin(users, eq(vinScans.userId, users.id));
    const conditions: any[] = [];

    if (filters?.userId) conditions.push(eq(vinScans.userId, filters.userId));
    if (filters?.vinNumber) conditions.push(like(vinScans.vinNumber, `%${filters.vinNumber}%`));
    if (filters?.dateFrom) conditions.push(gte(vinScans.createdAt, filters.dateFrom));
    if (filters?.dateTo) conditions.push(lte(vinScans.createdAt, filters.dateTo));
    if (conditions.length) query = query.where(and(...conditions));
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.offset(filters.offset);

    const rows: any = await query.orderBy(desc(vinScans.createdAt));
    return rows.map((row: any) => ({
      ...row.vin_scans,
      user: row.users!,
    }));
  }

async getVinScanByVin(vin: string): Promise<VinScanWithUser | undefined> {
  console.log("Searching VIN in DB:", vin); // add this
  const [row] = await db
    .select()
    .from(vinScans)
    .leftJoin(users, eq(vinScans.userId, users.id))
    .where(eq(vinScans.vinNumber, vin));

  console.log("DB row found:", row); // add this

  if (!row) return undefined;
  return { ...row.vin_scans, user: row.users! };
}
  async getVinScanById(id: string): Promise<VinScanWithUser | undefined> {
    const [row] = await db
      .select()
      .from(vinScans)
      .leftJoin(users, eq(vinScans.userId, users.id))
      .where(eq(vinScans.id, id));

    if (!row) return undefined;
    return { ...row.vin_scans, user: row.users! };
  }

  async updateVinScan(id: string, data: Partial<InsertVinScan>): Promise<VinScan | undefined> {
    const [updated] = await db.update(vinScans).set({ ...data, updatedAt: new Date() }).where(eq(vinScans.id, id)).returning();
    return updated;
  }

  async deleteVinScan(id: string): Promise<boolean> {
    const result: any = await db.delete(vinScans).where(eq(vinScans.id, id));
    return result.rowCount > 0;
  }

  async deleteVinScans(ids: string[]): Promise<number> {
    if (!ids.length) return 0;
    let deletedCount = 0;
    for (const id of ids) {
      const deleted = await this.deleteVinScan(id);
      if (deleted) deletedCount++;
    }
    return deletedCount;
  }

  // Statistics
  async getUserScanStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [[totalResult], [successfulResult], [failedResult], [monthlyResult]] = await Promise.all([
      db.select({ count: count() }).from(vinScans).where(eq(vinScans.userId, userId)),
      db.select({ count: count() }).from(vinScans).where(and(eq(vinScans.userId, userId), eq(vinScans.scanStatus, 'complete'))),
      db.select({ count: count() }).from(vinScans).where(and(eq(vinScans.userId, userId), eq(vinScans.scanStatus, 'failed'))),
      db.select({ count: count() }).from(vinScans).where(and(eq(vinScans.userId, userId), gte(vinScans.createdAt, startOfMonth))),
    ]);

    return {
      totalScans: totalResult.count,
      successfulScans: successfulResult.count,
      failedScans: failedResult.count,
      monthlyScans: monthlyResult.count,
    };
  }

  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [[usersResult], [totalScansResult], [todayScansResult], [failedScansResult], [successfulScansResult]] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(vinScans),
      db.select({ count: count() }).from(vinScans).where(gte(vinScans.createdAt, today)),
      db.select({ count: count() }).from(vinScans).where(eq(vinScans.scanStatus, 'failed')),
      db.select({ count: count() }).from(vinScans).where(eq(vinScans.scanStatus, 'complete')),
    ]);

    const totalScans = totalScansResult.count;
    const successRate = totalScans > 0 ? (successfulScansResult.count / totalScans) * 100 : 0;

    return {
      totalUsers: usersResult.count,
      totalScans: totalScans,
      todayScans: todayScansResult.count,
      failedScans: failedScansResult.count,
      successRate: Math.round(successRate * 10) / 10,
    };
  }
}

// Export a singleton instance
export const storage: IStorage = new DatabaseStorage();
