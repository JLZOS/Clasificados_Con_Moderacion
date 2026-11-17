import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";
import type { Listing, ListingInput, ListingStatus } from "@/domain/listing";
import { firebase } from "@/lib/firebase";
import { compact, toListing } from "./converters";

const PAGE_SIZE = 100;

function listingsRef() {
  return collection(firebase().db, "listings");
}

export async function getListing(id: string): Promise<Listing | null> {
  return toListing(await getDoc(doc(listingsRef(), id)));
}

export async function listByStatus(status: ListingStatus): Promise<Listing[]> {
  const q = query(
    listingsRef(),
    where("status", "==", status),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE),
  );
  const snap = await getDocs(q);
  return compact(snap.docs.map(toListing));
}

export async function listBySeller(sellerId: string): Promise<Listing[]> {
  const q = query(listingsRef(), where("sellerId", "==", sellerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return compact(snap.docs.map(toListing));
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(-60);
}

async function uploadPhotos(uid: string, listingId: string, photos: readonly File[]) {
  const { storage } = firebase();
  const uploads = photos.map(async (photo, i) => {
    const photoRef = ref(storage, `listings/${uid}/${listingId}/${i}-${safeFileName(photo.name)}`);
    await uploadBytes(photoRef, photo, { contentType: photo.type });
    return getDownloadURL(photoRef);
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
  const folder = ref(firebase().storage, `listings/${listing.sellerId}/${listing.id}`);
  const files = await listAll(folder);
  await Promise.all(files.items.map((item) => deleteObject(item)));
  await deleteDoc(doc(listingsRef(), listing.id));
}
