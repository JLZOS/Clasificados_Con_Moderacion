import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-clasificados";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "fake-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
  projectId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:000000000000:web:0000000000000000",
};

export const usingEmulators =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== "false" || projectId.startsWith("demo-");

export const allowedEmailDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "";

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

function connectEmulators(services: FirebaseServices): void {
  connectAuthEmulator(services.auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(services.db, "127.0.0.1", 8080);
}

function init(): FirebaseServices {
  const isFirstInit = getApps().length === 0;
  const app = isFirstInit ? initializeApp(config) : getApp();
  const services = { app, auth: getAuth(app), db: getFirestore(app) };
  if (isFirstInit && usingEmulators) connectEmulators(services);
  return services;
}

let cached: FirebaseServices | null = null;

export function firebase(): FirebaseServices {
  cached ??= init();
  return cached;
}
