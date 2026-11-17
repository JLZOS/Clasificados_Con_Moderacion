import { describe, expect, it } from "vitest";
import { availableActions, moderate, requiresNote } from "../moderation";

describe("availableActions", () => {
  it.each([
    ["pending", ["approve", "reject"]],
    ["approved", ["reject", "hide"]],
    ["hidden", ["reject", "restore"]],
    ["rejected", ["approve"]],
    ["sold", []],
  ] as const)("para %s permite %j", (status, actions) => {
    expect(availableActions(status)).toEqual(actions);
  });
});

describe("moderate", () => {
  it("aprueba un anuncio pendiente sin exigir nota", () => {
    expect(moderate({ status: "pending", reportCount: 0 }, "approve")).toEqual({
      ok: true,
      status: "approved",
      reportCount: 0,
      note: null,
    });
  });

  it("exige una nota para rechazar", () => {
    const result = moderate({ status: "pending", reportCount: 0 }, "reject", "  no ");
    expect(result).toEqual({ ok: false, error: "Explique el motivo (mínimo 5 caracteres)" });
  });

  it("rechaza con nota y la guarda recortada", () => {
    const result = moderate(
      { status: "pending", reportCount: 0 },
      "reject",
      "  Fotos de internet ",
    );
    expect(result).toMatchObject({ ok: true, status: "rejected", note: "Fotos de internet" });
  });

  it("restaurar un anuncio oculto reinicia el contador de reportes", () => {
    const result = moderate({ status: "hidden", reportCount: 3 }, "restore");
    expect(result).toMatchObject({ ok: true, status: "approved", reportCount: 0 });
  });

  it("ocultar conserva los reportes y exige motivo", () => {
    const result = moderate({ status: "approved", reportCount: 1 }, "hide", "Revisando denuncia");
    expect(result).toMatchObject({ ok: true, status: "hidden", reportCount: 1 });
  });

  it("no permite transiciones inválidas", () => {
    const result = moderate({ status: "sold", reportCount: 0 }, "approve");
    expect(result).toEqual({ ok: false, error: "No se puede aprobar este anuncio" });
  });

  it("indica qué acciones requieren nota", () => {
    expect(requiresNote("reject")).toBe(true);
    expect(requiresNote("hide")).toBe(true);
    expect(requiresNote("approve")).toBe(false);
  });
});
