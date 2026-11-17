import type { Category, Listing } from "./listing";

export const SORT_OPTIONS = ["recent", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  recent: "Más recientes",
  price_asc: "Menor precio",
  price_desc: "Mayor precio",
};

export interface ListingFilters {
  text: string;
  category: Category | "all";
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortOption;
}

export const DEFAULT_FILTERS: ListingFilters = {
  text: "",
  category: "all",
  minPrice: null,
  maxPrice: null,
  sort: "recent",
};

type Searchable = Pick<Listing, "title" | "description" | "category" | "price" | "createdAt">;

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesText(listing: Searchable, text: string): boolean {
  const terms = normalizeText(text).split(/\s+/).filter(Boolean);
  const haystack = normalizeText(`${listing.title} ${listing.description}`);
  return terms.every((term) => haystack.includes(term));
}

function matchesPrice(price: number, min: number | null, max: number | null): boolean {
  return (min === null || price >= min) && (max === null || price <= max);
}

const COMPARATORS: Record<SortOption, (a: Searchable, b: Searchable) => number> = {
  recent: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
};

export function filterListings<T extends Searchable>(
  listings: readonly T[],
  filters: ListingFilters,
): T[] {
  return listings
    .filter((l) => filters.category === "all" || l.category === filters.category)
    .filter((l) => matchesPrice(l.price, filters.minPrice, filters.maxPrice))
    .filter((l) => matchesText(l, filters.text))
    .sort(COMPARATORS[filters.sort]);
}
