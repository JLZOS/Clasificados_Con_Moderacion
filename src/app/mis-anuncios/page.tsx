"use client";

import { useCallback } from "react";
import { useAsync } from "@/hooks/useAsync";
import type { AppUser } from "@/services/auth";
import { listBySeller } from "@/services/listings";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Feedback";
import { ListingGrid } from "@/components/listings/ListingGrid";

function MyListings({ user }: { user: AppUser }) {
  const load = useCallback(() => listBySeller(user.uid), [user.uid]);
  const { data, error, loading } = useAsync(load);
  return (
    <ListingGrid
      listings={data ?? []}
      loading={loading}
      error={error}
      showStatus
      emptyTitle="Todavía no ha publicado anuncios"
      emptyAction={<ButtonLink href="/publicar">Publicar el primero</ButtonLink>}
    />
  );
}

export default function MyListingsPage() {
  return (
    <>
      <PageHeader
        title="Mis anuncios"
        subtitle="Revise el estado de sus publicaciones y las notas de moderación."
      />
      <RequireAuth>{(user) => <MyListings user={user} />}</RequireAuth>
    </>
  );
}
