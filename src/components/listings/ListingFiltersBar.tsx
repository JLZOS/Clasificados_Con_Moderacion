"use client";

import { CATEGORIES, CATEGORY_LABELS, parsePrice, type Category } from "@/domain/listing";
import { SORT_LABELS, SORT_OPTIONS, type ListingFilters, type SortOption } from "@/domain/search";
import { inputClass } from "@/components/ui/Field";

interface Props {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}

const isCategory = (v: string): v is Category => CATEGORIES.some((c) => c === v);
const isSort = (v: string): v is SortOption => SORT_OPTIONS.some((s) => s === v);

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      aria-label={label}
      placeholder={label}
      inputMode="numeric"
      className={inputClass}
      value={value ?? ""}
      onChange={(e) => onChange(parsePrice(e.target.value))}
    />
  );
}

export function ListingFiltersBar({ filters, onChange }: Props) {
  const set = (patch: Partial<ListingFilters>) => onChange({ ...filters, ...patch });
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
      <input
        type="search"
        aria-label="Buscar"
        placeholder="Buscar: libro de cálculo, bicicleta…"
        className={inputClass}
        value={filters.text}
        onChange={(e) => set({ text: e.target.value })}
      />
      <select
        aria-label="Categoría"
        className={inputClass}
        value={filters.category}
        onChange={(e) => set({ category: isCategory(e.target.value) ? e.target.value : "all" })}
      >
        <option value="all">Todas las categorías</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <PriceInput
        label="Precio mínimo"
        value={filters.minPrice}
        onChange={(v) => set({ minPrice: v })}
      />
      <PriceInput
        label="Precio máximo"
        value={filters.maxPrice}
        onChange={(v) => set({ maxPrice: v })}
      />
      <select
        aria-label="Ordenar"
        className={inputClass}
        value={filters.sort}
        onChange={(e) => set({ sort: isSort(e.target.value) ? e.target.value : "recent" })}
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
