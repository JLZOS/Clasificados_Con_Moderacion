"use client";

import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/domain/listing";
import { formatPrice, formatRelativeDate } from "@/domain/format";
import { Alert, EmptyState, Spinner } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/listings/StatusBadge";
import { ModerationActions } from "./ModerationActions";

function QueueItem({
  listing,
  moderatorId,
  onDone,
}: {
  listing: Listing;
  moderatorId: string;
  onDone: () => void;
}) {
  const cover = listing.photoUrls[0];
  return (
    <li className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[120px_1fr_1.2fr]">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
        {cover ? (
          <Image src={cover} alt={listing.title} fill unoptimized className="object-cover" />
        ) : null}
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing.status} />
          {listing.reportCount > 0 ? (
            <span className="text-xs font-semibold text-red-700">
              {listing.reportCount} reporte(s)
            </span>
          ) : null}
        </div>
        <Link
          href={`/anuncios/${listing.id}`}
          className="font-semibold text-slate-900 hover:text-brand-700 hover:underline"
        >
          {listing.title}
        </Link>
        <p className="text-sm text-slate-600">
          {formatPrice(listing.price)} · {listing.sellerName} ·{" "}
          {formatRelativeDate(listing.createdAt)}
        </p>
        <p className="line-clamp-3 text-sm text-slate-500">{listing.description}</p>
      </div>
      <ModerationActions listing={listing} moderatorId={moderatorId} onDone={onDone} />
    </li>
  );
}

interface QueueProps {
  listings: Listing[] | null;
  loading: boolean;
  error: string | null;
  moderatorId: string;
  emptyTitle: string;
  onDone: () => void;
}

export function ModerationQueue({
  listings,
  loading,
  error,
  moderatorId,
  emptyTitle,
  onDone,
}: QueueProps) {
  if (error) return <Alert tone="error">{error}</Alert>;
  if (loading && !listings) return <Spinner />;
  if (!listings || listings.length === 0)
    return <EmptyState title={emptyTitle} description="No hay nada pendiente aquí." />;
  return (
    <ul className="space-y-4">
      {listings.map((listing) => (
        <QueueItem key={listing.id} listing={listing} moderatorId={moderatorId} onDone={onDone} />
      ))}
    </ul>
  );
}
