"use client";

import { useMemo, useState } from "react";
import { DEFAULT_FILTERS, filterListings } from "@/domain/search";
import { useAsync } from "@/hooks/useAsync";
import { listByStatus } from "@/services/listings";
import { useAuth } from "@/components/auth/AuthProvider";
import { ButtonLink } from "@/components/ui/Button";
import { ListingFiltersBar } from "@/components/listings/ListingFiltersBar";
import { ListingGrid } from "@/components/listings/ListingGrid";

const loadApproved = () => listByStatus("approved");

function Hero() {
  const { user } = useAuth();
  return (
    <section className="mb-8 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-10 text-white shadow-lg sm:px-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Compra y vende dentro de tu universidad
      </h1>
      <p className="mt-2 max-w-2xl text-brand-100">
        Libros, tecnología, muebles y más entre estudiantes. Cada anuncio es revisado por
        moderadores antes de publicarse.
      </p>
      <div className="mt-6">
        <ButtonLink href={user ? "/publicar" : "/ingresar"} variant="secondary">
          Publicar un anuncio
        </ButtonLink>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data, error, loading } = useAsync(loadApproved);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const visible = useMemo(() => filterListings(data ?? [], filters), [data, filters]);

  return (
    <>
      <Hero />
      <div className="space-y-6">
        <ListingFiltersBar filters={filters} onChange={setFilters} />
        <p className="text-sm text-slate-500">
          {loading ? "Cargando anuncios…" : `${visible.length} anuncio(s)`}
        </p>
        <ListingGrid
          listings={visible}
          loading={loading}
          error={error}
          emptyTitle="No encontramos anuncios"
          emptyDescription="Pruebe con otra búsqueda o categoría."
        />
      </div>
    </>
  );
}
