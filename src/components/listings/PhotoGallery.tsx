"use client";

import Image from "next/image";
import { useState } from "react";

export function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = photos[index] ?? photos[0];
  if (!current) return <div className="aspect-[4/3] rounded-xl bg-slate-100" />;
  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <Image src={current} alt={title} fill unoptimized priority className="object-contain" />
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === index}
              className="relative size-16 shrink-0 overflow-hidden rounded-lg border-2 border-transparent aria-pressed:border-brand-600"
            >
              <Image src={photo} alt="" fill unoptimized className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
