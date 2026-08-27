import { z } from "zod";

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
  damages: z.array(z.object({ x: z.number().min(0).max(400), y: z.number().min(0).max(220) })).max(60),
  records: z.array(routeRecordSchema).min(1).max(4),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
