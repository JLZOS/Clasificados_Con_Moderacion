import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import type { Listing } from "@/domain/listing";
import { firebase } from "@/lib/firebase";
import { compact } from "./converters";
import { getListing } from "./listings";

function favoritesRef(uid: string) {
  return collection(firebase().db, "users", uid, "favorites");
}

export async function listFavoriteIds(uid: string): Promise<Set<string>> {
  const snap = await getDocs(favoritesRef(uid));
  return new Set(snap.docs.map((d) => d.id));
}

export async function addFavorite(uid: string, listingId: string): Promise<void> {
  await setDoc(doc(favoritesRef(uid), listingId), { createdAt: serverTimestamp() });
}

export async function removeFavorite(uid: string, listingId: string): Promise<void> {
  await deleteDoc(doc(favoritesRef(uid), listingId));
}

async function getListingIfVisible(id: string): Promise<Listing | null> {
  try {
    return await getListing(id);
  } catch {
    return null;
  }
}

export async function listFavoriteListings(uid: string): Promise<Listing[]> {
  const ids = await listFavoriteIds(uid);
  const listings = await Promise.all([...ids].map(getListingIfVisible));
  return compact(listings);
}
