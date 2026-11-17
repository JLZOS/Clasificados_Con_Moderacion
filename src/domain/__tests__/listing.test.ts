import { describe, expect, it } from "vitest";
import { LISTING_LIMITS, parsePrice, validateListingInput, validatePhotos } from "../listing";

const valid = {
  title: "Libro de Cálculo Stewart",
  description: "Octava edición, con algunas notas a lápiz en los primeros capítulos.",
  price: 80000,
  category: "libros",
  condition: "usado",
  contact: "WhatsApp 300 000 0000",
};

describe("validateListingInput", () => {
  it("acepta un anuncio válido y recorta espacios", () => {
    const result = validateListingInput({ ...valid, title: "  Libro de Cálculo  " });
    expect(result).toEqual({ ok: true, value: { ...valid, title: "Libro de Cálculo" } });
  });

  it("rechaza títulos cortos y descripciones cortas con mensajes por campo", () => {
    const result = validateListingInput({ ...valid, title: "abc", description: "corta" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.title).toMatch(/al menos 5/);
    expect(result.errors.description).toMatch(/al menos 20/);
  });

  it("rechaza precios negativos, decimales o por encima del máximo", () => {
    for (const price of [-1, 10.5, LISTING_LIMITS.priceMax + 1]) {
      const result = validateListingInput({ ...valid, price });
      expect(result.ok).toBe(false);
    }
  });

  it("acepta precio 0 (regalo)", () => {
    expect(validateListingInput({ ...valid, price: 0 }).ok).toBe(true);
  });

  it("rechaza categorías y estados desconocidos", () => {
    const result = validateListingInput({ ...valid, category: "armas", condition: "roto" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.category).toBeDefined();
    expect(result.errors.condition).toBeDefined();
  });

  it("exige un medio de contacto", () => {
    const result = validateListingInput({ ...valid, contact: " 12 " });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.contact).toMatch(/contactarlo/);
  });

  it("reporta el error de formulario cuando la entrada no es un objeto", () => {
    const result = validateListingInput(null);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.form).toBeDefined();
  });
});

describe("validatePhotos", () => {
  const photo = { name: "a.jpg", size: 1000, type: "image/jpeg" };

  it("exige al menos una foto", () => {
    expect(validatePhotos([])).toEqual(["Agregue al menos una foto"]);
  });

  it("acepta hasta 5 fotos válidas", () => {
    expect(validatePhotos(Array.from({ length: 5 }, () => photo))).toEqual([]);
  });

  it("rechaza más de 5 fotos", () => {
    expect(validatePhotos(Array.from({ length: 6 }, () => photo))).toContain(
      "Máximo 5 fotos por anuncio",
    );
  });

  it("rechaza formatos no permitidos y archivos de más de 5 MB", () => {
    const errors = validatePhotos([
      { name: "virus.exe", size: 10, type: "application/x-msdownload" },
      { name: "grande.png", size: LISTING_LIMITS.photoMaxBytes + 1, type: "image/png" },
    ]);
    expect(errors).toEqual([
      "virus.exe: formato no permitido (use JPG, PNG o WebP)",
      "grande.png: supera los 5 MB",
    ]);
  });
});

describe("parsePrice", () => {
  it.each([
    ["45000", 45000],
    ["45.000", 45000],
    ["$ 1.250.000", 1250000],
    ["0", 0],
  ])("convierte %s en %d", (text, expected) => {
    expect(parsePrice(text)).toBe(expected);
  });

  it.each(["", "abc", "12,5", "-3"])("devuelve null para %s", (text) => {
    expect(parsePrice(text)).toBeNull();
  });
});
