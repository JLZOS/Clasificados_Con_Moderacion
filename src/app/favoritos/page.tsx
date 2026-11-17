"use client";

import { useCallback } from "react";
import { useAsync } from "@/hooks/useAsync";
import type { AppUser } from "@/services/auth";
import { listFavoriteListings } from "@/services/favorites";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Feedback";
import { ListingGrid } from "@/components/listings/ListingGrid";

function Favorites({ user }: { user: AppUser }) {
  const load = useCallback(() => listFavoriteListings(user.uid), [user.uid]);
  const { data, error, loading } = useAsync(load);
  return (
    <ListingGrid
      listings={data ?? []}
      loading={loading}
      error={error}
      emptyTitle="Aún no tiene favoritos"
      emptyDescription="Guarde anuncios para encontrarlos fácilmente después."
      emptyAction={<ButtonLink href="/">Explorar anuncios</ButtonLink>}
    />
  );
}

export default function FavoritesPage() {
  return (
    <>
      <PageHeader title="Favoritos" subtitle="Anuncios que guardó para ver más tarde." />
      <RequireAuth>{(user) => <Favorites user={user} />}</RequireAuth>
    </>
  );
}
