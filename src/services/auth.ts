import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { z } from "zod";
import { toFieldErrors, type ValidationResult } from "@/domain/listing";
import { isAllowedEmail, roleFromClaims, type Role } from "@/domain/permissions";
import { allowedEmailDomain, firebase } from "@/lib/firebase";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

const credentialsSchema = z.object({
  email: z.email("Correo inválido").refine((e) => isAllowedEmail(e, allowedEmailDomain), {
    message: `Use su correo institucional (@${allowedEmailDomain})`,
  }),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const registerSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2, "Escriba su nombre").max(80),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type Registration = z.infer<typeof registerSchema>;

export function validateRegistration(raw: unknown): ValidationResult<Registration> {
  const parsed = registerSchema.safeParse(raw);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, errors: toFieldErrors(parsed.error) };
}

async function toAppUser(user: User): Promise<AppUser> {
  const token = await user.getIdTokenResult();
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? user.email ?? "Estudiante",
    role: roleFromClaims(token.claims),
  };
}

export function watchUser(callback: (user: AppUser | null) => void): () => void {
  return onIdTokenChanged(firebase().auth, (user) => {
    if (!user) return callback(null);
    void toAppUser(user).then(callback);
  });
}

export async function signIn({ email, password }: Credentials): Promise<void> {
  await signInWithEmailAndPassword(firebase().auth, email, password);
}

export async function register({ email, password, displayName }: Registration): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(firebase().auth, email, password);
  await updateProfile(user, { displayName });
  await user.getIdToken(true);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(firebase().auth);
}

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo",
  "auth/too-many-requests": "Demasiados intentos. Espere un momento",
  "auth/network-request-failed": "Sin conexión con el servidor (¿están corriendo los emuladores?)",
};

export function authErrorMessage(error: unknown): string {
  const code = error instanceof Error && "code" in error ? String(error.code) : "";
  return AUTH_MESSAGES[code] ?? "No fue posible completar la operación";
}
