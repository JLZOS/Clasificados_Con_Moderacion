import { describe, expect, it } from "vitest";
import {
  canDeletePhotos,
  isListingPhotoPathname,
  listingPhotoPrefix,
  photoPathname,
  photoProxyUrl,
  safeFileName,
} from "../photos";

describe("safeFileName", () => {
  it("reemplaza caracteres no seguros y recorta a 60", () => {
    expect(safeFileName("mi foto (1).jpg")).toBe("mi_foto_1_.jpg");
    expect(safeFileName(`${"a".repeat(70)}.png`)).toHaveLength(60);
  });
});

describe("photoPathname", () => {
  it("arma listings/{uid}/{listingId}/{i}-{archivo}", () => {
    expect(photoPathname("ana", "abc123", 0, "foto 1.jpg")).toBe(
      "listings/ana/abc123/0-foto_1.jpg",
    );
  });

  it("rechaza segmentos inválidos o índices fuera de rango", () => {
    expect(photoPathname("../x", "abc", 0, "a.jpg")).toBeNull();
    expect(photoPathname("ana", "a/b", 0, "a.jpg")).toBeNull();
    expect(photoPathname("ana", "abc", 5, "a.jpg")).toBeNull();
    expect(photoPathname("ana", "abc", -1, "a.jpg")).toBeNull();
    expect(photoPathname("ana", "abc", 1.5, "a.jpg")).toBeNull();
    expect(photoPathname("ana", "abc", 0, "")).toBeNull();
  });
});

describe("isListingPhotoPathname", () => {
  it("acepta solo rutas de fotos de anuncios", () => {
    expect(isListingPhotoPathname("listings/mod-1/abc/0-a.jpg")).toBe(true);
    expect(isListingPhotoPathname("listings/ana/abc/a.jpg")).toBe(false);
    expect(isListingPhotoPathname("otros/ana/abc/0-a.jpg")).toBe(false);
    expect(isListingPhotoPathname("listings/../abc/0-a.jpg")).toBe(false);
    expect(isListingPhotoPathname("https://evil.example/listings/a/b/0-a.jpg")).toBe(false);
    expect(isListingPhotoPathname(null)).toBe(false);
  });
});

describe("listingPhotoPrefix y photoProxyUrl", () => {
  it("prefijo de la carpeta del anuncio", () => {
    expect(listingPhotoPrefix("ana", "abc")).toBe("listings/ana/abc/");
    expect(listingPhotoPrefix("ana", "../abc")).toBeNull();
  });

  it("URL del proxy local codificada", () => {
    expect(photoProxyUrl("listings/ana/abc/0-a.jpg")).toBe(
      "/api/blob?pathname=listings%2Fana%2Fabc%2F0-a.jpg",
    );
  });
});

describe("canDeletePhotos", () => {
  it("borra el dueño de la carpeta o un moderador", () => {
    expect(canDeletePhotos({ uid: "ana", role: "student" }, "ana")).toBe(true);
    expect(canDeletePhotos({ uid: "mod", role: "moderator" }, "ana")).toBe(true);
    expect(canDeletePhotos({ uid: "luis", role: "student" }, "ana")).toBe(false);
    expect(canDeletePhotos(null, "ana")).toBe(false);
  });
});
