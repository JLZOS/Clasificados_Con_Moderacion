import { describe, expect, it } from "vitest";
import { FAVORITES_MAX, canAddFavorite, toggleFavorite, visibleFavorites } from "../favorites";
import { formatPrice, formatRelativeDate } from "../format";
import { makeListing } from "./fixtures";

describe("formatPrice", () => {
  it("muestra 'Gratis' para precio 0", () => {
    expect(formatPrice(0)).toBe("Gratis");
  });

  it("formatea en pesos colombianos sin decimales", () => {
    expect(formatPrice(45000)).toMatch(/\$\s?45\.000/);
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2026-11-17T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it.each([
    [10_000, "hace un momento"],
    [5 * 60_000, "hace 5 min"],
    [3 * 3_600_000, "hace 3 h"],
    [26 * 3_600_000, "hace 1 día"],
    [3 * 86_400_000, "hace 3 días"],
  ])("%d ms atrás → %s", (ms, expected) => {
    expect(formatRelativeDate(ago(ms), now)).toBe(expected);
  });

  it("usa fecha absoluta después de una semana", () => {
    expect(formatRelativeDate(ago(10 * 86_400_000), now)).toMatch(/2026/);
  });

  it("fechas futuras cuentan como 'hace un momento'", () => {
    expect(formatRelativeDate(new Date(now.getTime() + 60_000), now)).toBe("hace un momento");
  });
});

describe("favoritos", () => {
  it("toggleFavorite agrega y quita sin mutar el original", () => {
    const original = new Set(["a"]);
    expect([...toggleFavorite(original, "b")]).toEqual(["a", "b"]);
    expect([...toggleFavorite(original, "a")]).toEqual([]);
    expect([...original]).toEqual(["a"]);
  });

  it("limita la cantidad de favoritos", () => {
    const full = new Set(Array.from({ length: FAVORITES_MAX }, (_, i) => String(i)));
    expect(canAddFavorite(full)).toBe(false);
    expect(canAddFavorite(new Set())).toBe(true);
  });

  it("solo muestra favoritos publicados o vendidos", () => {
    const listings = [
      makeListing({ id: "a", status: "approved" }),
      makeListing({ id: "b", status: "hidden" }),
      makeListing({ id: "c", status: "sold" }),
      makeListing({ id: "d", status: "approved" }),
    ];
    const result = visibleFavorites(listings, new Set(["a", "b", "c"]));
    expect(result.map((l) => l.id)).toEqual(["a", "c"]);
  });
});
