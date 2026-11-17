"use client";

import { useState } from "react";
import type { Listing } from "@/domain/listing";
import {
  ACTION_LABELS,
  availableActions,
  requiresNote,
  type ModerationAction,
} from "@/domain/moderation";
import { errorMessage } from "@/lib/errors";
import { moderateListing } from "@/services/moderation";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";

const VARIANT: Record<ModerationAction, ButtonVariant> = {
  approve: "primary",
  restore: "primary",
  reject: "danger",
  hide: "secondary",
};

interface Props {
  listing: Pick<Listing, "id" | "status" | "reportCount">;
  moderatorId: string;
  onDone: () => void;
}

function useModeration({ listing, moderatorId, onDone }: Props) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(action: ModerationAction) {
    setBusy(true);
    setError(null);
    try {
      await moderateListing(listing, action, note, moderatorId);
      setNote("");
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return { note, setNote, busy, error, apply };
}

export function ModerationActions(props: Props) {
  const { note, setNote, busy, error, apply } = useModeration(props);
  const actions = availableActions(props.listing.status);
  if (actions.length === 0)
    return <p className="text-sm text-slate-500">Sin acciones disponibles.</p>;
  return (
    <div className="space-y-2">
      <textarea
        aria-label="Nota de moderación"
        placeholder={
          actions.some(requiresNote)
            ? "Motivo (obligatorio para rechazar u ocultar)"
            : "Nota (opcional)"
        }
        rows={2}
        maxLength={300}
        className={inputClass}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            variant={VARIANT[action]}
            busy={busy}
            onClick={() => void apply(action)}
          >
            {ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
