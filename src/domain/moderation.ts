import type { Listing, ListingStatus } from "./listing";

export const MODERATION_ACTIONS = ["approve", "reject", "hide", "restore"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const ACTION_LABELS: Record<ModerationAction, string> = {
  approve: "Aprobar",
  reject: "Rechazar",
  hide: "Ocultar",
  restore: "Restaurar",
};

interface Transition {
  from: readonly ListingStatus[];
  to: ListingStatus;
  requiresNote: boolean;
  resetsReports: boolean;
}

const TRANSITIONS: Record<ModerationAction, Transition> = {
  approve: {
    from: ["pending", "rejected"],
    to: "approved",
    requiresNote: false,
    resetsReports: false,
  },
  reject: {
    from: ["pending", "hidden", "approved"],
    to: "rejected",
    requiresNote: true,
    resetsReports: false,
  },
  hide: { from: ["approved"], to: "hidden", requiresNote: true, resetsReports: false },
  restore: { from: ["hidden"], to: "approved", requiresNote: false, resetsReports: true },
};

export const MIN_NOTE_LENGTH = 5;

export type ModerationState = Pick<Listing, "status" | "reportCount">;

export type ModerationResult =
  | { ok: true; status: ListingStatus; reportCount: number; note: string | null }
  | { ok: false; error: string };

export function availableActions(status: ListingStatus): ModerationAction[] {
  return MODERATION_ACTIONS.filter((action) => TRANSITIONS[action].from.includes(status));
}

export function requiresNote(action: ModerationAction): boolean {
  return TRANSITIONS[action].requiresNote;
}

export function moderate(
  listing: ModerationState,
  action: ModerationAction,
  rawNote = "",
): ModerationResult {
  const transition = TRANSITIONS[action];
  if (!transition.from.includes(listing.status)) {
    return { ok: false, error: `No se puede ${ACTION_LABELS[action].toLowerCase()} este anuncio` };
  }
  const note = rawNote.trim();
  if (transition.requiresNote && note.length < MIN_NOTE_LENGTH) {
    return { ok: false, error: "Explique el motivo (mínimo 5 caracteres)" };
  }
  return {
    ok: true,
    status: transition.to,
    reportCount: transition.resetsReports ? 0 : listing.reportCount,
    note: note.length > 0 ? note : null,
  };
}
