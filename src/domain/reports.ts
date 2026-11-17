import { z } from "zod";
import { toFieldErrors, type Listing, type ValidationResult } from "./listing";

export const REPORT_REASONS = ["fraude", "prohibido", "ofensivo", "spam", "otro"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  fraude: "Posible estafa o fraude",
  prohibido: "Artículo prohibido",
  ofensivo: "Contenido ofensivo",
  spam: "Spam o duplicado",
  otro: "Otro motivo",
};

export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_THRESHOLD = 3;
export const REPORT_DETAILS_MAX = 500;

export const reportInputSchema = z
  .object({
    reason: z.enum(REPORT_REASONS, { error: "Seleccione un motivo" }),
    details: z.string().trim().max(REPORT_DETAILS_MAX, "Máximo 500 caracteres"),
  })
  .refine((r) => r.reason !== "otro" || r.details.length >= 10, {
    path: ["details"],
    message: "Describa el motivo (mínimo 10 caracteres)",
  });
export type ReportInput = z.infer<typeof reportInputSchema>;

export interface Report extends ReportInput {
  id: string;
  listingId: string;
  listingTitle: string;
  reporterId: string;
  status: ReportStatus;
  createdAt: Date;
}

export function validateReportInput(raw: unknown): ValidationResult<ReportInput> {
  const parsed = reportInputSchema.safeParse(raw);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, errors: toFieldErrors(parsed.error) };
}

export function reportId(listingId: string, reporterId: string): string {
  return `${listingId}_${reporterId}`;
}

export type CanReport = { ok: true } | { ok: false; error: string };

export function canReport(
  listing: Pick<Listing, "status" | "sellerId">,
  userId: string | null,
): CanReport {
  if (!userId) return { ok: false, error: "Inicie sesión para reportar" };
  if (listing.sellerId === userId)
    return { ok: false, error: "No puede reportar su propio anuncio" };
  if (listing.status !== "approved")
    return { ok: false, error: "Este anuncio ya no admite reportes" };
  return { ok: true };
}

export function applyReport(listing: Pick<Listing, "status" | "reportCount">): {
  status: Listing["status"];
  reportCount: number;
} {
  const reportCount = listing.reportCount + 1;
  const reachesThreshold = listing.status === "approved" && reportCount >= REPORT_THRESHOLD;
  return { reportCount, status: reachesThreshold ? "hidden" : listing.status };
}

export interface ReportGroup {
  listingId: string;
  listingTitle: string;
  total: number;
  byReason: Partial<Record<ReportReason, number>>;
  reports: Report[];
}

export function groupReportsByListing(reports: readonly Report[]): ReportGroup[] {
  const groups = new Map<string, ReportGroup>();
  for (const report of reports) {
    const group = groups.get(report.listingId) ?? {
      listingId: report.listingId,
      listingTitle: report.listingTitle,
      total: 0,
      byReason: {},
      reports: [],
    };
    group.total += 1;
    group.byReason[report.reason] = (group.byReason[report.reason] ?? 0) + 1;
    group.reports.push(report);
    groups.set(report.listingId, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}
