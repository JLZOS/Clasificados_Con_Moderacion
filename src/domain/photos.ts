import { LISTING_LIMITS } from "./listing";
import { isModerator, type Viewer } from "./permissions";

export const PHOTO_PROXY_PATH = "/api/blob";

const SEGMENT = /^[A-Za-z0-9_-]{1,128}$/;
const PHOTO_PATHNAME = /^listings\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9_-]{1,128}\/\d-[\w.-]{1,60}$/;

export function safeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(-60);
}

export function listingPhotoPrefix(uid: string, listingId: string): string | null {
  if (!SEGMENT.test(uid) || !SEGMENT.test(listingId)) return null;
  return `listings/${uid}/${listingId}/`;
}

export function photoPathname(
  uid: string,
  listingId: string,
  index: number,
  fileName: string,
): string | null {
  const prefix = listingPhotoPrefix(uid, listingId);
  const validIndex = Number.isInteger(index) && index >= 0 && index < LISTING_LIMITS.photosMax;
  if (prefix === null || !validIndex) return null;
  const pathname = `${prefix}${index}-${safeFileName(fileName)}`;
  return PHOTO_PATHNAME.test(pathname) ? pathname : null;
}

export function isListingPhotoPathname(pathname: string | null): pathname is string {
  return pathname !== null && PHOTO_PATHNAME.test(pathname);
}

export function photoProxyUrl(pathname: string): string {
  return `${PHOTO_PROXY_PATH}?pathname=${encodeURIComponent(pathname)}`;
}

export function canDeletePhotos(viewer: Viewer | null, ownerUid: string): boolean {
  return viewer !== null && (viewer.uid === ownerUid || isModerator(viewer));
}
