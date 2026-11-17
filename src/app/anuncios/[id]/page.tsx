"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";
import { useAsync } from "@/hooks/useAsync";
import { getListing } from "@/services/listings";
import { useAuth } from "@/components/auth/AuthProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, EmptyState, Spinner } from "@/components/ui/Feedback";
import { ListingDetail } from "@/components/listings/ListingDetail";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const load = useCallback(() => getListing(id), [id]);
  const { data: listing, error, loading, reload } = useAsync(authLoading ? null : load);

  if (authLoading || (loading && !listing)) return <Spinner />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!listing) {
    return (
      <EmptyState
        title="Anuncio no disponible"
        description="Puede haber sido eliminado o estar en revisión."
        action={<ButtonLink href="/">Volver a explorar</ButtonLink>}
      />
    );
  }
  return <ListingDetail listing={listing} user={user} onChanged={reload} />;
}
