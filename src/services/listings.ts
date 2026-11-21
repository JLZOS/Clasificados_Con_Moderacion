import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { upload } from "@vercel/blob/client";
import { z } from "zod";
import type { Listing, ListingInput, ListingStatus } from "@/domain/listing";
import { PHOTO_PROXY_PATH, photoPathname, photoProxyUrl } from "@/domain/photos";
import { firebase } from "@/lib/firebase";
import { compact, toListing } from "./converters";

const PAGE_SIZE = 100;

function listingsRef() {
  return collection(firebase().db, "listings");
}

export async function getListing(id: string): Promise<Listing | null> {
  return toListing(await getDocFromServer(doc(listingsRef(), id)));
}

export async function listByStatus(status: ListingStatus): Promise<Listing[]> {
  const q = query(
    listingsRef(),
    where("status", "==", status),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE),
  );
  const snap = await getDocsFromServer(q);
  return compact(snap.docs.map(toListing));
}

export async function listBySeller(sellerId: string): Promise<Listing[]> {
  const q = query(listingsRef(), where("sellerId", "==", sellerId), orderBy("createdAt", "desc"));
  const snap = await getDocsFromServer(q);
  return compact(snap.docs.map(toListing));
}

const errorResponseSchema = z.object({ error: z.string().min(1) });

async function authHeaders(): Promise<Record<string, string>> {
  const user = firebase().auth.currentUser;
  if (!user) throw new Error("Debe iniciar sesión");
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

async function ensureOk(response: Response): Promise<Response> {
  if (response.ok) return response;
  const body = errorResponseSchema.safeParse(await response.json().catch(() => null));
  throw new Error(body.success ? body.data.error : "No fue posible completar la operación");
}

async function uploadPhoto(pathname: string, photo: File, headers: Record<string, string>) {
  try {
    const blob = await upload(pathname, photo, {
      access: "private",
      handleUploadUrl: "/api/upload",
      contentType: photo.type,
      headers,
    });
    return photoProxyUrl(blob.pathname);
  } catch {
    throw new Error(`No fue posible subir "${photo.name}". Verifique su sesión e intente de nuevo`);
  }
}

async function uploadPhotos(uid: string, listingId: string, photos: readonly File[]) {
  const headers = await authHeaders();
  const uploads = photos.map((photo, i) => {
    const pathname = photoPathname(uid, listingId, i, photo.name);
    if (pathname === null) throw new Error("No fue posible preparar la subida de fotos");
    return uploadPhoto(pathname, photo, headers);
  });
  return Promise.all(uploads);
}

export interface Seller {
  uid: string;
  displayName: string;
}

export async function createListing(
  input: ListingInput,
  photos: readonly File[],
  seller: Seller,
): Promise<string> {
  const listingRef = doc(listingsRef());
  const photoUrls = await uploadPhotos(seller.uid, listingRef.id, photos);
  await setDoc(listingRef, {
    ...input,
    photoUrls,
    sellerId: seller.uid,
    sellerName: seller.displayName,
    status: "pending",
    reportCount: 0,
    moderationNote: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return listingRef.id;
}

export async function markSold(listingId: string): Promise<void> {
  await updateDoc(doc(listingsRef(), listingId), { status: "sold", updatedAt: serverTimestamp() });
}

export async function deleteListing(listing: Pick<Listing, "id" | "sellerId">): Promise<void> {
  const params = new URLSearchParams({ sellerId: listing.sellerId, listingId: listing.id });
  const headers = await authHeaders();
  await ensureOk(await fetch(`${PHOTO_PROXY_PATH}?${params}`, { method: "DELETE", headers }));
  await deleteDoc(doc(listingsRef(), listing.id));
}
