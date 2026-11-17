"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { ALLOWED_PHOTO_TYPES, LISTING_LIMITS } from "@/domain/listing";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string | undefined;
}

function Preview({ url, index, onRemove }: { url: string; index: number; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
      <Image src={url} alt={`Foto ${index + 1}`} fill unoptimized className="object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar foto ${index + 1}`}
        className="absolute top-1 right-1 rounded-full bg-black/60 px-2 text-sm text-white hover:bg-black"
      >
        ×
      </button>
    </div>
  );
}

function AddPhotos({ onAdd }: { onAdd: (files: File[]) => void }) {
  return (
    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-brand-600 hover:text-brand-700">
      <span className="text-2xl">+</span>
      <span className="text-xs">Agregar</span>
      <input
        type="file"
        multiple
        accept={ALLOWED_PHOTO_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          onAdd(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function PhotoPicker({ files, onChange, error }: Props) {
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">
        Fotos ({files.length}/{LISTING_LIMITS.photosMax})
      </span>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {previews.map((url, i) => (
          <Preview
            key={url}
            url={url}
            index={i}
            onRemove={() => onChange(files.filter((_, j) => j !== i))}
          />
        ))}
        {files.length < LISTING_LIMITS.photosMax ? (
          <AddPhotos onAdd={(added) => onChange([...files, ...added])} />
        ) : null}
      </div>
      <p
        className={`text-xs ${error ? "font-medium text-red-600" : "text-slate-500"}`}
        role={error ? "alert" : undefined}
      >
        {error ?? "JPG, PNG o WebP, máximo 5 MB cada una. La primera será la portada."}
      </p>
    </div>
  );
}
