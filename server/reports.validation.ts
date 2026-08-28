import { z } from "zod";
import { DAMAGE_CANVAS_HEIGHT, DAMAGE_CANVAS_WIDTH } from "@shared/damageMarks";

const textField = z.string().max(500);

export const routeRecordSchema = z.object({
  driver: textField,
  passenger: textField,
  rollCaller: textField,
  departurePlace: textField,
  arrivalPlace: textField,
  departureTime: z.string().max(16),
  arrivalTime: z.string().max(16),
  departureMeter: z.string().max(24),
  arrivalMeter: z.string().max(24),
  alcoholBefore: z.boolean(),
  alcoholAfter: z.boolean(),
  alcoholBeforeValue: z.string().max(24),
  alcoholAfterValue: z.string().max(24),
});

export const reportInputSchema = z.object({
  id: z.string().max(32).optional(),
  date: z.string().min(1).max(32),
  vehicleNumber: z.string().max(64),
  siteName: textField,
  sq: z.string().max(64),
  confirmer: z.string().max(160),
  inspection: z.record(z.string().max(500), z.boolean()),
  damages: z.array(z.object({ x: z.number().min(0).max(DAMAGE_CANVAS_WIDTH), y: z.number().min(0).max(DAMAGE_CANVAS_HEIGHT) })).max(60),
  records: z.array(routeRecordSchema).min(1).max(4),
});

export type ReportInput = z.infer<typeof reportInputSchema>;

export const reportSearchSchema = z.object({
  dateFrom: z.string().max(32).optional(),
  dateTo: z.string().max(32).optional(),
  vehicleNumber: z.string().max(64).optional(),
  sq: z.string().max(64).optional(),
  driver: z.string().max(160).optional(),
  siteName: z.string().max(500).optional(),
  sortBy: z.enum(["reportDate", "vehicleNumber", "sq", "driver", "updatedAt"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
}).optional();
