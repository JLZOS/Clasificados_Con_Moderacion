import {
  collection,
  doc,
  getDocsFromServer,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import type { Listing } from "@/domain/listing";
import { moderate, type ModerationAction } from "@/domain/moderation";
import { firebase } from "@/lib/firebase";

export class ModerationError extends Error {}

async function openReportRefs(listingId: string) {
  const q = query(
    collection(firebase().db, "reports"),
    where("listingId", "==", listingId),
    where("status", "==", "open"),
  );
  const snap = await getDocsFromServer(q);
  return snap.docs.map((d) => d.ref);
}

export async function moderateListing(
  listing: Pick<Listing, "id" | "status" | "reportCount">,
  action: ModerationAction,
  note: string,
  moderatorId: string,
): Promise<void> {
  const result = moderate(listing, action, note);
  if (!result.ok) throw new ModerationError(result.error);
  const { db } = firebase();
  const batch = writeBatch(db);
  batch.update(doc(db, "listings", listing.id), {
    status: result.status,
    reportCount: result.reportCount,
    moderationNote: result.note,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(db, "moderationLog")), {
    listingId: listing.id,
    action,
    note: result.note,
    from: listing.status,
    to: result.status,
    moderatorId,
    at: serverTimestamp(),
  });
  const reportStatus = action === "restore" || action === "approve" ? "dismissed" : "resolved";
  for (const reportRef of await openReportRefs(listing.id)) {
    batch.update(reportRef, {
      status: reportStatus,
      resolvedBy: moderatorId,
      resolvedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}
