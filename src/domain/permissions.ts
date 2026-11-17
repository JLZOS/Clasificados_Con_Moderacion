import type { Listing } from "./listing";

export type Role = "student" | "moderator";

export interface Viewer {
  uid: string;
  role: Role;
}

type Owned = Pick<Listing, "sellerId" | "status">;

const PUBLIC_STATUSES: ReadonlySet<Listing["status"]> = new Set(["approved", "sold"]);

export function isModerator(viewer: Viewer | null): boolean {
  return viewer?.role === "moderator";
}

export function isOwner(viewer: Viewer | null, listing: Owned): boolean {
  return viewer !== null && viewer.uid === listing.sellerId;
}

export function canViewListing(viewer: Viewer | null, listing: Owned): boolean {
  return PUBLIC_STATUSES.has(listing.status) || isOwner(viewer, listing) || isModerator(viewer);
}

export function canDeleteListing(viewer: Viewer | null, listing: Owned): boolean {
  return isOwner(viewer, listing) || isModerator(viewer);
}

export function canMarkSold(viewer: Viewer | null, listing: Owned): boolean {
  return isOwner(viewer, listing) && listing.status === "approved";
}

export function canFavorite(viewer: Viewer | null, listing: Owned): boolean {
  return viewer !== null && !isOwner(viewer, listing) && listing.status === "approved";
}

export function roleFromClaims(claims: Record<string, unknown>): Role {
  return claims.role === "moderator" ? "moderator" : "student";
}

export function isAllowedEmail(email: string, allowedDomain: string): boolean {
  const domain = allowedDomain.trim().toLowerCase();
  if (domain === "") return true;
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}
