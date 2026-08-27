import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 運転日報本体。可変長の点検項目・傷マーク・最大4件の運行記録は、
 * 帳票単位で整合性を保つためJSON文字列として保存します。
 */
export const dailyReports = mysqlTable("daily_reports", {
  id: varchar("id", { length: 32 }).primaryKey(),
  ownerId: int("ownerId").notNull(),
  reportDate: varchar("reportDate", { length: 32 }).notNull(),
  vehicleNumber: varchar("vehicleNumber", { length: 64 }).notNull(),
  siteName: text("siteName"),
  sq: varchar("sq", { length: 64 }),
  confirmer: varchar("confirmer", { length: 160 }),
  inspectionJson: text("inspectionJson").notNull(),
  damagesJson: text("damagesJson").notNull(),
  recordsJson: text("recordsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;
