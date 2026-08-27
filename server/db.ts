import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dailyReports, type DailyReport, type InsertDailyReport, type InsertUser, users } from "../drizzle/schema";
import type { ReportData } from "../shared/report";
import type { ReportInput } from "./reports.validation";
import { ENV } from './_core/env';
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toReportData(row: DailyReport): ReportData {
  return {
    id: row.id,
    date: row.reportDate,
    vehicleNumber: row.vehicleNumber,
    siteName: row.siteName ?? "",
    sq: row.sq ?? "",
    confirmer: row.confirmer ?? "",
    inspection: parseJson(row.inspectionJson, {}),
    damages: parseJson(row.damagesJson, []),
    records: parseJson(row.recordsJson, []),
  };
}

function serializeReport(ownerId: number, input: ReportInput, id: string): InsertDailyReport {
  return {
    id,
    ownerId,
    reportDate: input.date,
    vehicleNumber: input.vehicleNumber,
    siteName: input.siteName,
    sq: input.sq,
    confirmer: input.confirmer,
    inspectionJson: JSON.stringify(input.inspection),
    damagesJson: JSON.stringify(input.damages),
    recordsJson: JSON.stringify(input.records),
  };
}

export async function saveDailyReport(ownerId: number, input: ReportInput): Promise<ReportData> {
  const db = await getDb();
  if (!db) throw new Error("データベースに接続できません。時間をおいて再度お試しください。");

  const id = input.id ?? nanoid();
  const values = serializeReport(ownerId, input, id);
  const existing = await db
    .select({ id: dailyReports.id })
    .from(dailyReports)
    .where(and(eq(dailyReports.id, id), eq(dailyReports.ownerId, ownerId)))
    .limit(1);

  if (existing.length > 0) {
    const { id: _id, ownerId: _ownerId, ...updates } = values;
    await db.update(dailyReports).set(updates).where(and(eq(dailyReports.id, id), eq(dailyReports.ownerId, ownerId)));
  } else {
    await db.insert(dailyReports).values(values);
  }

  return { ...input, id };
}

export async function listDailyReports(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("データベースに接続できません。時間をおいて再度お試しください。");

  const rows = await db.select().from(dailyReports).where(eq(dailyReports.ownerId, ownerId)).orderBy(desc(dailyReports.updatedAt));
  return rows.map((row) => ({
    id: row.id,
    data: toReportData(row),
    updatedAt: row.updatedAt,
  }));
}

export async function getDailyReport(ownerId: number, id: string): Promise<ReportData | null> {
  const db = await getDb();
  if (!db) throw new Error("データベースに接続できません。時間をおいて再度お試しください。");

  const rows = await db
    .select()
    .from(dailyReports)
    .where(and(eq(dailyReports.id, id), eq(dailyReports.ownerId, ownerId)))
    .limit(1);
  return rows[0] ? toReportData(rows[0]) : null;
}
