import { describe, expect, it } from "vitest";
import {
  canDeleteListing,
  canFavorite,
  canMarkSold,
  canViewListing,
  isAllowedEmail,
  roleFromClaims,
  type Viewer,
} from "../permissions";

const owner: Viewer = { uid: "seller", role: "student" };
const other: Viewer = { uid: "other", role: "student" };
const mod: Viewer = { uid: "mod", role: "moderator" };

const listing = (status: "pending" | "approved" | "hidden" | "sold") => ({
  sellerId: "seller",
  status,
});

describe("canViewListing", () => {
  it("cualquiera ve anuncios publicados o vendidos", () => {
    expect(canViewListing(null, listing("approved"))).toBe(true);
    expect(canViewListing(null, listing("sold"))).toBe(true);
  });

  it("solo dueño y moderador ven anuncios pendientes u ocultos", () => {
    expect(canViewListing(null, listing("pending"))).toBe(false);
    expect(canViewListing(other, listing("hidden"))).toBe(false);
    expect(canViewListing(owner, listing("pending"))).toBe(true);
    expect(canViewListing(mod, listing("hidden"))).toBe(true);
  });
});

describe("acciones sobre el anuncio", () => {
  it("borra el dueño o un moderador", () => {
    expect(canDeleteListing(owner, listing("approved"))).toBe(true);
    expect(canDeleteListing(mod, listing("approved"))).toBe(true);
    expect(canDeleteListing(other, listing("approved"))).toBe(false);
    expect(canDeleteListing(null, listing("approved"))).toBe(false);
  });

  it("solo el dueño marca como vendido un anuncio publicado", () => {
    expect(canMarkSold(owner, listing("approved"))).toBe(true);
    expect(canMarkSold(owner, listing("pending"))).toBe(false);
    expect(canMarkSold(mod, listing("approved"))).toBe(false);
  });

  it("favoritos: con sesión, no propios y publicados", () => {
    expect(canFavorite(other, listing("approved"))).toBe(true);
    expect(canFavorite(owner, listing("approved"))).toBe(false);
    expect(canFavorite(null, listing("approved"))).toBe(false);
    expect(canFavorite(other, listing("sold"))).toBe(false);
  });
});

describe("roleFromClaims", () => {
  it("solo el claim role=moderator da permisos de moderación", () => {
    expect(roleFromClaims({ role: "moderator" })).toBe("moderator");
    expect(roleFromClaims({ role: "admin" })).toBe("student");
    expect(roleFromClaims({})).toBe("student");
  });
});

describe("isAllowedEmail", () => {
  it("acepta solo el dominio institucional, sin importar mayúsculas", () => {
    expect(isAllowedEmail("Ana@Universidad.edu.co", "universidad.edu.co")).toBe(true);
    expect(isAllowedEmail("ana@gmail.com", "universidad.edu.co")).toBe(false);
    expect(isAllowedEmail("ana@universidad.edu.co.evil.com", "universidad.edu.co")).toBe(false);
  });

  it("sin dominio configurado acepta cualquier correo", () => {
    expect(isAllowedEmail("ana@gmail.com", "  ")).toBe(true);
  });
});
