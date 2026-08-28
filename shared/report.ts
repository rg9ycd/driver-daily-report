export type DamageMark = {
  x: number;
  y: number;
};

export type RouteRecord = {
  driver: string;
  passenger: string;
  rollCaller: string;
  departurePlace: string;
  arrivalPlace: string;
  departureTime: string;
  arrivalTime: string;
  departureMeter: string;
  arrivalMeter: string;
  alcoholBefore: boolean;
  alcoholAfter: boolean;
  alcoholBeforeValue: string;
  alcoholAfterValue: string;
};

export type InspectionState = Record<string, boolean>;

export type ReportData = {
  id?: string;
  date: string;
  vehicleNumber: string;
  siteName: string;
  sq: string;
  confirmer: string;
  inspection: InspectionState;
  damages: DamageMark[];
  records: RouteRecord[];
};

export const PRE_OPERATION_INSPECTION_LABEL = "Pre-operation inspection";

export function formatVehicleNumber(value: string) {
  const normalized = value.trim();
  return normalized ? `${normalized}号車` : "";
}

export const inspectionGroups = [
  {
    name: "ブレーキ",
    items: [
      "ブレーキ、ペダルの踏みしろが適当で、ブレーキのききが十分である",
      "駐車ブレーキ、レバーの引きしろが適当である",
      "ブレーキ液の量が適当である（長距離運転時）",
    ],
  },
  {
    name: "タイヤ",
    items: ["タイヤの空気圧が適当である", "亀裂及び損傷がない", "異常な摩耗が無い"],
  },
  {
    name: "ランプ系",
    items: ["点灯または点滅具合が良好で、汚れ及び損傷がない"],
  },
] as const;

export const inspectionKeys = inspectionGroups.flatMap((group) =>
  group.items.map((item) => `${group.name}:${item}`),
);

export function createInitialRecord(): RouteRecord {
  return {
    driver: "",
    passenger: "",
    rollCaller: "",
    departurePlace: "",
    arrivalPlace: "",
    departureTime: "",
    arrivalTime: "",
    departureMeter: "",
    arrivalMeter: "",
    alcoholBefore: false,
    alcoholAfter: false,
    alcoholBeforeValue: "",
    alcoholAfterValue: "",
  };
}

function localDateInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function createInitialReport(): ReportData {
  return {
    date: localDateInputValue(),
    vehicleNumber: "",
    siteName: "",
    sq: "",
    confirmer: "",
    inspection: Object.fromEntries(inspectionKeys.map((key) => [key, false])),
    damages: [],
    records: Array.from({ length: 4 }, createInitialRecord),
  };
}

export function formatReportDate(value: string) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!matched) return value || "　年　月　日";
  return `${matched[1]}年${Number(matched[2])}月${Number(matched[3])}日`;
}
