"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageHeader } from "@/components/ui/Feedback";
import { ListingForm } from "@/components/listings/ListingForm";

export default function PublishPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Publicar un anuncio"
        subtitle="Su anuncio quedará en revisión hasta que un moderador lo apruebe."
      />
      <RequireAuth>{(user) => <ListingForm user={user} />}</RequireAuth>
    </div>
  );
}
