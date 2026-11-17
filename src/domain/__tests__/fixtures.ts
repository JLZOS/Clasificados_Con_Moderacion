import type { Listing } from "../listing";

export function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "l1",
    title: "Calculadora científica Casio",
    description: "Calculadora fx-991 en perfecto estado, ideal para cálculo.",
    price: 45000,
    category: "tecnologia",
    condition: "usado",
    sellerId: "seller",
    sellerName: "Ana",
    photoUrls: ["/seed/tecnologia.svg"],
    status: "approved",
    reportCount: 0,
    moderationNote: null,
    createdAt: new Date("2026-11-01T10:00:00Z"),
    updatedAt: new Date("2026-11-01T10:00:00Z"),
    ...overrides,
  };
}
