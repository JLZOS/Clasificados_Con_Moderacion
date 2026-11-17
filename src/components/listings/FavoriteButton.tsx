"use client";

import { useCallback, useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/lib/errors";
import { addFavorite, isFavorite, removeFavorite } from "@/services/favorites";
import { Button } from "@/components/ui/Button";

interface Props {
  uid: string;
  listingId: string;
}

export function FavoriteButton({ uid, listingId }: Props) {
  const load = useCallback(() => isFavorite(uid, listingId), [uid, listingId]);
  const { data: saved, loading } = useAsync(load);
  const [override, setOverride] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = override ?? saved ?? false;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await (active ? removeFavorite(uid, listingId) : addFavorite(uid, listingId));
      setOverride(!active);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        busy={busy || loading}
        onClick={() => void toggle()}
        aria-pressed={active}
      >
        <span aria-hidden className={active ? "text-red-500" : "text-slate-400"}>
          {active ? "♥" : "♡"}
        </span>
        {active ? "En favoritos" : "Guardar en favoritos"}
      </Button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
