import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { canReport, applyReport, reportId, type Report, type ReportInput } from "@/domain/reports";
import { firebase } from "@/lib/firebase";
import { compact, toListing, toReport } from "./converters";

export class ReportError extends Error {}

export async function submitReport(
  listingId: string,
  reporterId: string,
  input: ReportInput,
): Promise<void> {
  const { db } = firebase();
  const listingRef = doc(db, "listings", listingId);
  const reportRef = doc(db, "reports", reportId(listingId, reporterId));
  await runTransaction(db, async (tx) => {
    const listing = toListing(await tx.get(listingRef));
    if (!listing) throw new ReportError("El anuncio ya no existe");
    const allowed = canReport(listing, reporterId);
    if (!allowed.ok) throw new ReportError(allowed.error);
    if ((await tx.get(reportRef)).exists()) throw new ReportError("Ya reportó este anuncio");
    const next = applyReport(listing);
    tx.set(reportRef, {
      ...input,
      listingId,
      listingTitle: listing.title,
      reporterId,
      status: "open",
      createdAt: serverTimestamp(),
    });
    tx.update(listingRef, { ...next, updatedAt: serverTimestamp() });
  });
}

export async function listOpenReports(): Promise<Report[]> {
  const q = query(
    collection(firebase().db, "reports"),
    where("status", "==", "open"),
    orderBy("createdAt", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return compact(snap.docs.map(toReport));
}
