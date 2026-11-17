import { Timestamp, type DocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import { listingSchema, type Listing } from "@/domain/listing";
import { REPORT_REASONS, REPORT_STATUSES, type Report } from "@/domain/reports";

const timestamp = z.instanceof(Timestamp).transform((t) => t.toDate());

const listingDocSchema = listingSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  createdAt: timestamp,
  updatedAt: timestamp,
});

const reportDocSchema = z.object({
  listingId: z.string(),
  listingTitle: z.string(),
  reporterId: z.string(),
  reason: z.enum(REPORT_REASONS),
  details: z.string(),
  status: z.enum(REPORT_STATUSES),
  createdAt: timestamp,
});

export function toListing(snap: DocumentSnapshot): Listing | null {
  if (!snap.exists()) return null;
  const parsed = listingDocSchema.safeParse(snap.data({ serverTimestamps: "estimate" }));
  return parsed.success ? { id: snap.id, ...parsed.data } : null;
}

export function toReport(snap: DocumentSnapshot): Report | null {
  if (!snap.exists()) return null;
  const parsed = reportDocSchema.safeParse(snap.data({ serverTimestamps: "estimate" }));
  return parsed.success ? { id: snap.id, ...parsed.data } : null;
}

export function compact<T>(items: readonly (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null);
}
