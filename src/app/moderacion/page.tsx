"use client";

import { useMemo, useState } from "react";
import { groupReportsByListing } from "@/domain/reports";
import { useAsync } from "@/hooks/useAsync";
import type { AppUser } from "@/services/auth";
import { listByStatus } from "@/services/listings";
import { listOpenReports } from "@/services/reports";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageHeader } from "@/components/ui/Feedback";
import { ModerationQueue } from "@/components/moderation/ModerationQueue";
import { ReportGroups } from "@/components/moderation/ReportGroups";

type Tab = "pending" | "reports" | "hidden" | "approved";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pendientes" },
  { id: "reports", label: "Reportes abiertos" },
  { id: "hidden", label: "Ocultos" },
  { id: "approved", label: "Publicados" },
];

type StatusTabId = Exclude<Tab, "reports">;

const LOADERS: Record<StatusTabId, () => ReturnType<typeof listByStatus>> = {
  pending: () => listByStatus("pending"),
  hidden: () => listByStatus("hidden"),
  approved: () => listByStatus("approved"),
};

function StatusTab({ status, moderatorId }: { status: StatusTabId; moderatorId: string }) {
  const { data, error, loading, reload } = useAsync(LOADERS[status]);
  return (
    <ModerationQueue
      listings={data}
      loading={loading}
      error={error}
      moderatorId={moderatorId}
      emptyTitle="Cola vacía"
      onDone={reload}
    />
  );
}

function ReportsTab() {
  const { data, error, loading } = useAsync(listOpenReports);
  const groups = useMemo(() => (data ? groupReportsByListing(data) : null), [data]);
  return <ReportGroups groups={groups} loading={loading} error={error} />;
}

function ModerationPanel({ user }: { user: AppUser }) {
  const [tab, setTab] = useState<Tab>("pending");
  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Colas de moderación"
        className="flex flex-wrap gap-2 border-b border-slate-200 pb-2"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 aria-selected:bg-brand-700 aria-selected:text-white"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "reports" ? (
          <ReportsTab />
        ) : (
          <StatusTab key={tab} status={tab} moderatorId={user.uid} />
        )}
      </div>
    </div>
  );
}

export default function ModerationPage() {
  return (
    <>
      <PageHeader
        title="Panel de moderación"
        subtitle="Apruebe anuncios nuevos, atienda reportes y gestione contenido oculto."
      />
      <RequireAuth role="moderator">{(user) => <ModerationPanel user={user} />}</RequireAuth>
    </>
  );
}
