import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  password: varchar("password").notNull(), 
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// VIN scans table
export const vinScans = pgTable("vin_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  vinNumber: varchar("vin_number", { length: 17 }).notNull(),
  userName: varchar("user_name").notNull(),
  userIdField: varchar("user_id_field").notNull(),
  mobileNumber: varchar("mobile_number").notNull(),
  vehicleModel: varchar("vehicle_model").notNull(),
  vehicleColor: varchar("vehicle_color").notNull(),
  scanTimestamp: timestamp("scan_timestamp").defaultNow(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  materialConfirmed: boolean("material_confirmed").default(false),
  ocrAttempts: integer("ocr_attempts").default(1),
  scanStatus: varchar("scan_status").notNull().default("complete"), // 'complete', 'failed', 'processing'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  vinScans: many(vinScans),
}));

export const vinScansRelations = relations(vinScans, ({ one }) => ({
  user: one(users, {
    fields: [vinScans.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVinScanSchema = createInsertSchema(vinScans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  vinNumber: z.string().length(17, "VIN must be exactly 17 characters"),
  userName: z.string().min(1, "Name is required"),
  userIdField: z.string().min(1, "User ID is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleColor: z.string().min(1, "Vehicle color is required"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertVinScan = z.infer<typeof insertVinScanSchema>;
export type VinScan = typeof vinScans.$inferSelect;
export type VinScanWithUser = VinScan & { user: User };
