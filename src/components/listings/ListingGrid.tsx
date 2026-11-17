import type { ReactNode } from "react";
import type { Listing } from "@/domain/listing";
import { Alert, EmptyState, Spinner } from "@/components/ui/Feedback";
import { ListingCard } from "./ListingCard";

interface ListingGridProps {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  showStatus?: boolean;
}

export function ListingGrid(props: ListingGridProps) {
  if (props.error) return <Alert tone="error">{props.error}</Alert>;
  if (props.loading && props.listings.length === 0) return <Spinner />;
  if (props.listings.length === 0) {
    return (
      <EmptyState
        title={props.emptyTitle}
        {...(props.emptyDescription ? { description: props.emptyDescription } : {})}
        action={props.emptyAction}
      />
    );
  }
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {props.listings.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} showStatus={props.showStatus ?? false} />
        </li>
      ))}
    </ul>
  );
}
