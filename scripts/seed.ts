// Siembra datos de ejemplo SOLO en el Emulator Suite. Nunca toca un proyecto real.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import type { Category, Condition, ListingStatus } from "../src/domain/listing";

const PROJECT_ID = "demo-clasificados";
const PASSWORD = "Clasificados123!";

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

interface SeedUser {
  uid: string;
  email: string;
  displayName: string;
  moderator?: boolean;
}

const USERS: SeedUser[] = [
  {
    uid: "mod-1",
    email: "moderador@universidad.edu.co",
    displayName: "Moderación",
    moderator: true,
  },
  { uid: "ana", email: "ana@universidad.edu.co", displayName: "Ana Gómez" },
  { uid: "luis", email: "luis@universidad.edu.co", displayName: "Luis Pérez" },
];

interface SeedListing {
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  seller: string;
  status: ListingStatus;
  reportCount?: number;
}

const LISTINGS: SeedListing[] = [
  {
    title: "Cálculo de una variable – Stewart 8.ª ed.",
    description: "Libro en muy buen estado, algunas notas a lápiz en los primeros capítulos.",
    price: 85000,
    category: "libros",
    condition: "usado",
    seller: "ana",
    status: "approved",
  },
  {
    title: "Calculadora Casio fx-991LA X",
    description: "Calculadora científica, incluye tapa y pilas nuevas. Ideal para ingeniería.",
    price: 60000,
    category: "tecnologia",
    condition: "como_nuevo",
    seller: "luis",
    status: "approved",
  },
  {
    title: "Bicicleta urbana rin 26",
    description: "Bicicleta para moverse por el campus, frenos revisados hace un mes.",
    price: 350000,
    category: "deportes",
    condition: "usado",
    seller: "ana",
    status: "approved",
  },
  {
    title: "Escritorio plegable para estudiar",
    description: "Escritorio de 100 x 50 cm, fácil de guardar. Recoger cerca de la universidad.",
    price: 120000,
    category: "muebles",
    condition: "usado",
    seller: "luis",
    status: "approved",
    reportCount: 1,
  },
  {
    title: "Tutorías de programación en Python",
    description: "Clases personalizadas de Python y estructuras de datos, primera sesión gratis.",
    price: 30000,
    category: "servicios",
    condition: "nuevo",
    seller: "ana",
    status: "pending",
  },
  {
    title: "Chaqueta impermeable talla M",
    description: "Chaqueta negra impermeable, usada una sola temporada, sin daños.",
    price: 70000,
    category: "ropa",
    condition: "como_nuevo",
    seller: "luis",
    status: "pending",
  },
  {
    title: "Audífonos inalámbricos baratísimos",
    description: "Réplica idéntica a los originales, pague por adelantado a mi cuenta personal.",
    price: 20000,
    category: "tecnologia",
    condition: "nuevo",
    seller: "luis",
    status: "hidden",
    reportCount: 3,
  },
  {
    title: "Apuntes de Física I completos",
    description: "Apuntes digitalizados de todo el semestre con ejercicios resueltos.",
    price: 15000,
    category: "libros",
    condition: "nuevo",
    seller: "ana",
    status: "sold",
  },
];

async function seedUsers(): Promise<void> {
  const auth = getAuth();
  for (const user of USERS) {
    await auth.deleteUser(user.uid).catch(() => undefined);
    await auth.createUser({ ...user, password: PASSWORD, emailVerified: true });
    if (user.moderator) await auth.setCustomUserClaims(user.uid, { role: "moderator" });
  }
}

function sellerName(uid: string): string {
  return USERS.find((u) => u.uid === uid)?.displayName ?? uid;
}

async function seedListings(): Promise<void> {
  const db = getFirestore();
  const now = Date.now();
  for (const [i, item] of LISTINGS.entries()) {
    const { seller, reportCount = 0, ...data } = item;
    const createdAt = Timestamp.fromMillis(now - i * 5 * 3_600_000);
    await db.doc(`listings/seed-${i + 1}`).set({
      ...data,
      photoUrls: [`/seed/${data.category}.svg`],
      sellerId: seller,
      sellerName: sellerName(seller),
      reportCount,
      moderationNote: null,
      createdAt,
      updatedAt: createdAt,
    });
  }
}

async function seedReports(): Promise<void> {
  const db = getFirestore();
  const reports = [
    { listing: "seed-7", reporter: "ana", reason: "fraude", details: "Pide pago por adelantado." },
    { listing: "seed-7", reporter: "mod-1", reason: "prohibido", details: "Venta de réplicas." },
    { listing: "seed-4", reporter: "ana", reason: "spam", details: "" },
  ];
  for (const r of reports) {
    await db.doc(`reports/${r.listing}_${r.reporter}`).set({
      listingId: r.listing,
      listingTitle: LISTINGS[Number(r.listing.split("-")[1]) - 1]?.title ?? "",
      reporterId: r.reporter,
      reason: r.reason,
      details: r.details,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID });
  await seedUsers();
  await seedListings();
  await seedReports();
  process.stdout.write(
    `Datos sembrados en ${PROJECT_ID}. Usuarios: ${USERS.map((u) => u.email).join(", ")} ` +
      `(contraseña de desarrollo: ${PASSWORD})\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Error al sembrar (¿está corriendo "npm run emulators"?): ${String(error)}\n`,
  );
  process.exit(1);
});
