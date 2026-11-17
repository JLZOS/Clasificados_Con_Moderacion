"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Listing } from "@/domain/listing";
import { canDeleteListing, canMarkSold, isOwner, type Viewer } from "@/domain/permissions";
import { errorMessage } from "@/lib/errors";
import { deleteListing, markSold } from "@/services/listings";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";

interface Props {
  viewer: Viewer;
  listing: Listing;
  onChanged: () => void;
}

export function OwnerActions({ viewer, listing, onChanged }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>, after: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      after();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const onDelete = () => {
    if (!window.confirm("¿Eliminar definitivamente este anuncio y sus fotos?")) return;
    const next = isOwner(viewer, listing) ? "/mis-anuncios" : "/moderacion";
    void run(
      () => deleteListing(listing),
      () => router.push(next),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canMarkSold(viewer, listing) ? (
          <Button busy={busy} onClick={() => void run(() => markSold(listing.id), onChanged)}>
            Marcar como vendido
          </Button>
        ) : null}
        {canDeleteListing(viewer, listing) ? (
          <Button variant="danger" busy={busy} onClick={onDelete}>
            Eliminar
          </Button>
        ) : null}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
