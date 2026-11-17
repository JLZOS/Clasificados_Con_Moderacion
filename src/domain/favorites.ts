import type { Listing } from "./listing";

export const FAVORITES_MAX = 100;

export function toggleFavorite(ids: ReadonlySet<string>, listingId: string): Set<string> {
  const next = new Set(ids);
  if (next.has(listingId)) {
    next.delete(listingId);
  } else {
    next.add(listingId);
  }
  return next;
}

export function canAddFavorite(ids: ReadonlySet<string>): boolean {
  return ids.size < FAVORITES_MAX;
}

export function visibleFavorites<T extends Pick<Listing, "id" | "status">>(
  listings: readonly T[],
  ids: ReadonlySet<string>,
): T[] {
  return listings.filter((l) => ids.has(l.id) && (l.status === "approved" || l.status === "sold"));
}
