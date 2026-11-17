"use client";

import Link from "next/link";
import { CATEGORY_LABELS, CONDITION_LABELS, type Listing } from "@/domain/listing";
import { formatPrice, formatRelativeDate } from "@/domain/format";
import { canDeleteListing, canFavorite, isModerator } from "@/domain/permissions";
import { canReport } from "@/domain/reports";
import type { AppUser } from "@/services/auth";
import { Alert } from "@/components/ui/Feedback";
import { ModerationActions } from "@/components/moderation/ModerationActions";
import { FavoriteButton } from "./FavoriteButton";
import { OwnerActions } from "./OwnerActions";
import { PhotoGallery } from "./PhotoGallery";
import { ReportPanel } from "./ReportPanel";
import { StatusBadge } from "./StatusBadge";

interface Props {
  listing: Listing;
  user: AppUser | null;
  onChanged: () => void;
}

function StatusNotice({ listing }: { listing: Listing }) {
  if (listing.status === "pending") {
    return (
      <Alert tone="warning">
        Este anuncio está en revisión. Solo usted y los moderadores pueden verlo.
      </Alert>
    );
  }
  if (listing.status === "rejected" || listing.status === "hidden") {
    return (
      <Alert tone="error">
        Este anuncio no es visible para otros estudiantes.
        {listing.moderationNote ? ` Motivo: ${listing.moderationNote}` : ""}
      </Alert>
    );
  }
  return null;
}

function Contact({ listing, user }: { listing: Listing; user: AppUser | null }) {
  if (!user) {
    return (
      <p className="text-sm text-slate-600">
        <Link href="/ingresar" className="font-semibold text-brand-700 underline">
          Inicie sesión
        </Link>{" "}
        para ver el contacto del vendedor.
      </p>
    );
  }
  return (
    <p className="text-sm text-slate-700">
      <span className="font-semibold">Contacto:</span> {listing.contact}
    </p>
  );
}

function Summary({ listing }: { listing: Listing }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={listing.status} />
        <span className="text-xs text-slate-500">
          {CATEGORY_LABELS[listing.category]} · {CONDITION_LABELS[listing.condition]} ·{" "}
          {formatRelativeDate(listing.createdAt)}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
      <p className="text-3xl font-bold text-brand-800">{formatPrice(listing.price)}</p>
      <p className="text-sm text-slate-600">Publicado por {listing.sellerName}</p>
      <p className="whitespace-pre-line text-slate-700">{listing.description}</p>
    </div>
  );
}

function ModeratorBox({ listing, user, onChanged }: Props & { user: AppUser }) {
  return (
    <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-sm font-bold text-slate-800">
        Panel de moderación · {listing.reportCount} reporte(s)
      </h2>
      <ModerationActions listing={listing} moderatorId={user.uid} onDone={onChanged} />
    </section>
  );
}

export function ListingDetail({ listing, user, onChanged }: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <PhotoGallery photos={listing.photoUrls} title={listing.title} />
      <div className="space-y-5">
        <StatusNotice listing={listing} />
        <Summary listing={listing} />
        <Contact listing={listing} user={user} />
        {user && canFavorite(user, listing) ? (
          <FavoriteButton uid={user.uid} listingId={listing.id} />
        ) : null}
        {user && canDeleteListing(user, listing) ? (
          <OwnerActions viewer={user} listing={listing} onChanged={onChanged} />
        ) : null}
        {user && isModerator(user) ? (
          <ModeratorBox listing={listing} user={user} onChanged={onChanged} />
        ) : null}
        {user && canReport(listing, user.uid).ok ? (
          <ReportPanel listingId={listing.id} reporterId={user.uid} />
        ) : null}
      </div>
    </div>
  );
}
