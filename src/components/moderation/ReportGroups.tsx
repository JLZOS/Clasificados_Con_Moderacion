"use client";

import Link from "next/link";
import { formatRelativeDate } from "@/domain/format";
import { REPORT_REASON_LABELS, type ReportGroup, type ReportReason } from "@/domain/reports";
import { Alert, EmptyState, Spinner } from "@/components/ui/Feedback";

function ReasonChips({ byReason }: { byReason: ReportGroup["byReason"] }) {
  const entries = Object.entries(byReason).filter(
    (entry): entry is [ReportReason, number] => entry[1] !== undefined,
  );
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([reason, count]) => (
        <span
          key={reason}
          className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
        >
          {REPORT_REASON_LABELS[reason]} × {count}
        </span>
      ))}
    </div>
  );
}

function GroupItem({ group }: { group: ReportGroup }) {
  return (
    <li className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/anuncios/${group.listingId}`}
          className="font-semibold text-slate-900 hover:text-brand-700 hover:underline"
        >
          {group.listingTitle || group.listingId}
        </Link>
        <span className="text-sm font-semibold text-red-700">
          {group.total} reporte(s) abiertos
        </span>
      </div>
      <ReasonChips byReason={group.byReason} />
      <ul className="space-y-1 text-sm text-slate-600">
        {group.reports
          .filter((r) => r.details)
          .map((r) => (
            <li key={r.id}>
              “{r.details}”{" "}
              <span className="text-xs text-slate-400">· {formatRelativeDate(r.createdAt)}</span>
            </li>
          ))}
      </ul>
      <Link
        href={`/anuncios/${group.listingId}`}
        className="inline-block text-sm font-semibold text-brand-700 underline"
      >
        Revisar y moderar →
      </Link>
    </li>
  );
}

interface Props {
  groups: ReportGroup[] | null;
  loading: boolean;
  error: string | null;
}

export function ReportGroups({ groups, loading, error }: Props) {
  if (error) return <Alert tone="error">{error}</Alert>;
  if (loading && !groups) return <Spinner />;
  if (!groups || groups.length === 0) return <EmptyState title="No hay reportes abiertos" />;
  return (
    <ul className="space-y-4">
      {groups.map((group) => (
        <GroupItem key={group.listingId} group={group} />
      ))}
    </ul>
  );
}
