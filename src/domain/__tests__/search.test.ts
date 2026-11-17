import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, filterListings, normalizeText } from "../search";
import { makeListing } from "./fixtures";

const listings = [
  makeListing({
    id: "a",
    title: "Cálculo de Stewart",
    category: "libros",
    price: 80000,
    createdAt: new Date("2026-11-03"),
  }),
  makeListing({
    id: "b",
    title: "Bicicleta montañera",
    description: "Rin 29, frenos de disco, poco uso en ciclovía.",
    category: "deportes",
    price: 450000,
    createdAt: new Date("2026-11-01"),
  }),
  makeListing({
    id: "c",
    title: "Portátil Lenovo",
    description: "16 GB de RAM, SSD de 512 GB, batería en buen estado.",
    category: "tecnologia",
    price: 1200000,
    createdAt: new Date("2026-11-02"),
  }),
];

const ids = (items: { id: string }[]) => items.map((l) => l.id);

describe("normalizeText", () => {
  it("quita tildes y pasa a minúsculas", () => {
    expect(normalizeText("  CÁLCULO Ñandú ")).toBe("calculo nandu");
  });
});

describe("filterListings", () => {
  it("por defecto ordena del más reciente al más antiguo", () => {
    expect(ids(filterListings(listings, DEFAULT_FILTERS))).toEqual(["a", "c", "b"]);
  });

  it("busca por texto sin importar tildes y exige todos los términos", () => {
    expect(ids(filterListings(listings, { ...DEFAULT_FILTERS, text: "calculo stewart" }))).toEqual([
      "a",
    ]);
    expect(filterListings(listings, { ...DEFAULT_FILTERS, text: "calculo bici" })).toEqual([]);
  });

  it("filtra por categoría", () => {
    const result = filterListings(listings, { ...DEFAULT_FILTERS, category: "deportes" });
    expect(ids(result)).toEqual(["b"]);
  });

  it("filtra por rango de precio y ordena por precio", () => {
    const filters = { ...DEFAULT_FILTERS, minPrice: 50000, maxPrice: 500000 };
    expect(ids(filterListings(listings, { ...filters, sort: "price_asc" }))).toEqual(["a", "b"]);
    expect(ids(filterListings(listings, { ...filters, sort: "price_desc" }))).toEqual(["b", "a"]);
  });

  it("no modifica el arreglo original", () => {
    const copy = [...listings];
    filterListings(listings, { ...DEFAULT_FILTERS, sort: "price_desc" });
    expect(listings).toEqual(copy);
  });
});
