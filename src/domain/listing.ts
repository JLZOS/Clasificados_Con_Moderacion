import { z } from "zod";

export const CATEGORIES = [
  "libros",
  "tecnologia",
  "ropa",
  "muebles",
  "deportes",
  "servicios",
  "otros",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  libros: "Libros y apuntes",
  tecnologia: "Tecnología",
  ropa: "Ropa y accesorios",
  muebles: "Muebles y hogar",
  deportes: "Deportes",
  servicios: "Servicios y tutorías",
  otros: "Otros",
};

export const CONDITIONS = ["nuevo", "como_nuevo", "usado"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_LABELS: Record<Condition, string> = {
  nuevo: "Nuevo",
  como_nuevo: "Como nuevo",
  usado: "Usado",
};

export const LISTING_STATUSES = ["pending", "approved", "rejected", "hidden", "sold"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const STATUS_LABELS: Record<ListingStatus, string> = {
  pending: "En revisión",
  approved: "Publicado",
  rejected: "Rechazado",
  hidden: "Oculto por reportes",
  sold: "Vendido",
};

export const LISTING_LIMITS = {
  titleMin: 5,
  titleMax: 80,
  descriptionMin: 20,
  descriptionMax: 2000,
  priceMax: 50_000_000,
  photosMin: 1,
  photosMax: 5,
  photoMaxBytes: 5 * 1024 * 1024,
} as const;

export const ALLOWED_PHOTO_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

const L = LISTING_LIMITS;

export const listingInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(L.titleMin, `El título debe tener al menos ${L.titleMin} caracteres`)
    .max(L.titleMax, `El título admite máximo ${L.titleMax} caracteres`),
  description: z
    .string()
    .trim()
    .min(L.descriptionMin, `La descripción debe tener al menos ${L.descriptionMin} caracteres`)
    .max(L.descriptionMax, `La descripción admite máximo ${L.descriptionMax} caracteres`),
  price: z
    .number({ error: "El precio debe ser un número" })
    .int("El precio debe ser un valor entero en pesos")
    .min(0, "El precio no puede ser negativo")
    .max(L.priceMax, "El precio supera el máximo permitido"),
  category: z.enum(CATEGORIES, { error: "Seleccione una categoría válida" }),
  condition: z.enum(CONDITIONS, { error: "Seleccione el estado del artículo" }),
});
export type ListingInput = z.infer<typeof listingInputSchema>;

export const listingSchema = listingInputSchema.extend({
  id: z.string().min(1),
  sellerId: z.string().min(1),
  sellerName: z.string(),
  photoUrls: z.array(z.string().min(1)).max(L.photosMax),
  status: z.enum(LISTING_STATUSES),
  reportCount: z.number().int().min(0),
  moderationNote: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Listing = z.infer<typeof listingSchema>;

export type FieldErrors = Partial<Record<string, string>>;
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}

export function validateListingInput(raw: unknown): ValidationResult<ListingInput> {
  const parsed = listingInputSchema.safeParse(raw);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, errors: toFieldErrors(parsed.error) };
}

export interface PhotoMeta {
  name: string;
  size: number;
  type: string;
}

export function validatePhotos(photos: readonly PhotoMeta[]): string[] {
  const errors: string[] = [];
  if (photos.length < L.photosMin) errors.push("Agregue al menos una foto");
  if (photos.length > L.photosMax) errors.push(`Máximo ${L.photosMax} fotos por anuncio`);
  for (const photo of photos) {
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      errors.push(`${photo.name}: formato no permitido (use JPG, PNG o WebP)`);
    } else if (photo.size > L.photoMaxBytes) {
      errors.push(`${photo.name}: supera los 5 MB`);
    }
  }
  return errors;
}

export function parsePrice(text: string): number | null {
  const digits = text.replace(/[$\s.]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  return Number.parseInt(digits, 10);
}
