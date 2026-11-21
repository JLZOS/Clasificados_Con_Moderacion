import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { roleFromClaims, type Viewer } from "@/domain/permissions";
import { usingEmulators } from "./firebase";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-clasificados";

if (usingEmulators) process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

function adminAuth() {
  return getAuth(getApps()[0] ?? initializeApp({ projectId }));
}

function bearerToken(request: Request): string | null {
  const match = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "");
  return match?.[1] ?? null;
}

export async function viewerFromRequest(request: Request): Promise<Viewer | null> {
  const token = bearerToken(request);
  if (token === null) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid, role: roleFromClaims(decoded) };
  } catch {
    return null;
  }
}
