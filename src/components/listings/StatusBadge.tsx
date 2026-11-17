import { STATUS_LABELS, type ListingStatus } from "@/domain/listing";

const STYLES: Record<ListingStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  hidden: "bg-slate-200 text-slate-800",
  sold: "bg-sky-100 text-sky-800",
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
