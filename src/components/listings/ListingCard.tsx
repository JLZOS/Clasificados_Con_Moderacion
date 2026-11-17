import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS, type Listing } from "@/domain/listing";
import { formatPrice, formatRelativeDate } from "@/domain/format";
import { StatusBadge } from "./StatusBadge";

interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
}

export function ListingCard({ listing, showStatus = false }: ListingCardProps) {
  const cover = listing.photoUrls[0];
  return (
    <Link
      href={`/anuncios/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : null}
        {showStatus || listing.status === "sold" ? (
          <div className="absolute top-2 left-2">
            <StatusBadge status={listing.status} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-lg font-bold text-brand-800">{formatPrice(listing.price)}</p>
        <h2 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">
          {listing.title}
        </h2>
        <p className="mt-auto pt-2 text-xs text-slate-500">
          {CATEGORY_LABELS[listing.category]} · {formatRelativeDate(listing.createdAt)}
        </p>
        {showStatus && listing.moderationNote ? (
          <p className="mt-1 text-xs text-red-700">Moderación: {listing.moderationNote}</p>
        ) : null}
      </div>
    </Link>
  );
}
