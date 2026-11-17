"use client";

import { useState, type FormEvent } from "react";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  LISTING_LIMITS,
  parsePrice,
  validateListingInput,
  validatePhotos,
  type FieldErrors,
} from "@/domain/listing";
import { errorMessage } from "@/lib/errors";
import type { AppUser } from "@/services/auth";
import { createListing } from "@/services/listings";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { PhotoPicker } from "./PhotoPicker";

function readForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const text = (key: string) => String(data.get(key) ?? "");
  return {
    title: text("title"),
    description: text("description"),
    price: parsePrice(text("price")) ?? Number.NaN,
    category: text("category"),
    condition: text("condition"),
    contact: text("contact"),
  };
}

function useListingForm(user: AppUser) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateListingInput(readForm(event.currentTarget));
    const photoErrors = validatePhotos(photos);
    const fieldErrors = result.ok ? {} : result.errors;
    if (!result.ok || photoErrors.length > 0) {
      return setErrors({ ...fieldErrors, photos: photoErrors.join(" · ") || undefined });
    }
    setBusy(true);
    setErrors({});
    try {
      setCreatedId(await createListing(result.value, photos, user));
    } catch (e) {
      setErrors({ form: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }
  return { photos, setPhotos, errors, busy, createdId, submit };
}

function Select({
  id,
  options,
  labels,
}: {
  id: string;
  options: readonly string[];
  labels: Record<string, string>;
}) {
  return (
    <select id={id} name={id} defaultValue="" className={inputClass}>
      <option value="" disabled>
        Seleccione…
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {labels[o]}
        </option>
      ))}
    </select>
  );
}

function Created({ id }: { id: string }) {
  return (
    <div className="space-y-4">
      <Alert tone="success">
        ¡Listo! Su anuncio quedó <strong>en revisión</strong>. Será visible cuando un moderador lo
        apruebe.
      </Alert>
      <div className="flex gap-2">
        <ButtonLink href={`/anuncios/${id}`}>Ver anuncio</ButtonLink>
        <ButtonLink href="/mis-anuncios" variant="secondary">
          Mis anuncios
        </ButtonLink>
      </div>
    </div>
  );
}

function ClassificationFields({ errors }: { errors: FieldErrors }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      <Field id="price" label="Precio (COP)" error={errors.price} hint="0 = gratis">
        <input
          id="price"
          name="price"
          inputMode="numeric"
          className={inputClass}
          placeholder="45.000"
        />
      </Field>
      <Field id="category" label="Categoría" error={errors.category}>
        <Select id="category" options={CATEGORIES} labels={CATEGORY_LABELS} />
      </Field>
      <Field id="condition" label="Estado" error={errors.condition}>
        <Select id="condition" options={CONDITIONS} labels={CONDITION_LABELS} />
      </Field>
    </div>
  );
}

function ContactField({ error }: { error: string | undefined }) {
  return (
    <Field
      id="contact"
      label="Contacto"
      error={error}
      hint="Será visible en el anuncio publicado. No incluya datos sensibles."
    >
      <input
        id="contact"
        name="contact"
        maxLength={LISTING_LIMITS.contactMax}
        className={inputClass}
        placeholder="WhatsApp o correo institucional"
      />
    </Field>
  );
}

export function ListingForm({ user }: { user: AppUser }) {
  const { photos, setPhotos, errors, busy, createdId, submit } = useListingForm(user);
  if (createdId) return <Created id={createdId} />;
  return (
    <form
      onSubmit={(e) => void submit(e)}
      noValidate
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <PhotoPicker files={photos} onChange={setPhotos} error={errors.photos} />
      <Field id="title" label="Título" error={errors.title}>
        <input
          id="title"
          name="title"
          maxLength={LISTING_LIMITS.titleMax}
          className={inputClass}
          placeholder="Ej.: Calculadora Casio fx-991"
        />
      </Field>
      <ClassificationFields errors={errors} />
      <Field id="description" label="Descripción" error={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={LISTING_LIMITS.descriptionMax}
          className={inputClass}
        />
      </Field>
      <ContactField error={errors.contact} />
      {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
      <Button type="submit" busy={busy} className="w-full sm:w-auto">
        {busy ? "Publicando…" : "Enviar a revisión"}
      </Button>
    </form>
  );
}
