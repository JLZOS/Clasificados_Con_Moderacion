import { describe, expect, it } from "vitest";
import {
  REPORT_THRESHOLD,
  applyReport,
  canReport,
  groupReportsByListing,
  reportId,
  validateReportInput,
  type Report,
} from "../reports";

describe("validateReportInput", () => {
  it("acepta un motivo de la lista sin detalles", () => {
    expect(validateReportInput({ reason: "fraude", details: "" })).toEqual({
      ok: true,
      value: { reason: "fraude", details: "" },
    });
  });

  it("exige detalles cuando el motivo es 'otro'", () => {
    const result = validateReportInput({ reason: "otro", details: "feo" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.details).toMatch(/mínimo 10/);
  });

  it("rechaza motivos desconocidos y detalles demasiado largos", () => {
    expect(validateReportInput({ reason: "x", details: "" }).ok).toBe(false);
    expect(validateReportInput({ reason: "spam", details: "a".repeat(501) }).ok).toBe(false);
  });
});

describe("canReport", () => {
  const listing = { status: "approved" as const, sellerId: "seller" };

  it("exige sesión", () => {
    expect(canReport(listing, null)).toEqual({ ok: false, error: "Inicie sesión para reportar" });
  });

  it("impide reportar el propio anuncio", () => {
    expect(canReport(listing, "seller").ok).toBe(false);
  });

  it("solo se reportan anuncios publicados", () => {
    expect(canReport({ ...listing, status: "hidden" }, "otro").ok).toBe(false);
    expect(canReport(listing, "otro")).toEqual({ ok: true });
  });
});

describe("applyReport", () => {
  it("suma un reporte sin cambiar el estado bajo el umbral", () => {
    expect(applyReport({ status: "approved", reportCount: 0 })).toEqual({
      status: "approved",
      reportCount: 1,
    });
  });

  it(`oculta automáticamente al llegar a ${REPORT_THRESHOLD} reportes`, () => {
    expect(applyReport({ status: "approved", reportCount: REPORT_THRESHOLD - 1 })).toEqual({
      status: "hidden",
      reportCount: REPORT_THRESHOLD,
    });
  });

  it("no cambia el estado de anuncios no publicados", () => {
    expect(applyReport({ status: "pending", reportCount: 5 }).status).toBe("pending");
  });
});

describe("reportId y groupReportsByListing", () => {
  it("un usuario solo puede tener un reporte por anuncio", () => {
    expect(reportId("abc", "u1")).toBe("abc_u1");
  });

  it("agrupa por anuncio, cuenta motivos y ordena por total", () => {
    const base = {
      details: "",
      status: "open" as const,
      createdAt: new Date(),
      listingTitle: "T",
    };
    const reports: Report[] = [
      { ...base, id: "1", listingId: "a", reporterId: "u1", reason: "spam" },
      { ...base, id: "2", listingId: "b", reporterId: "u1", reason: "fraude" },
      { ...base, id: "3", listingId: "b", reporterId: "u2", reason: "fraude" },
      { ...base, id: "4", listingId: "b", reporterId: "u3", reason: "spam" },
    ];
    const groups = groupReportsByListing(reports);
    expect(groups.map((g) => [g.listingId, g.total])).toEqual([
      ["b", 3],
      ["a", 1],
    ]);
    expect(groups[0]?.byReason).toEqual({ fraude: 2, spam: 1 });
  });
});
