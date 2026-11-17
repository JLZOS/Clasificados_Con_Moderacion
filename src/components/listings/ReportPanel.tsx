"use client";

import { useState, type FormEvent } from "react";
import type { FieldErrors } from "@/domain/listing";
import {
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  validateReportInput,
} from "@/domain/reports";
import { errorMessage } from "@/lib/errors";
import { submitReport } from "@/services/reports";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";

interface Props {
  listingId: string;
  reporterId: string;
  onReported: () => void;
}

function useReportForm({ listingId, reporterId, onReported }: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = validateReportInput({
      reason: data.get("reason"),
      details: data.get("details"),
    });
    if (!result.ok) return setErrors(result.errors);
    setBusy(true);
    try {
      await submitReport(listingId, reporterId, result.value);
      onReported();
    } catch (e) {
      setErrors({ form: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }
  return { errors, busy, submit };
}

export function ReportForm(props: Props & { onCancel: () => void }) {
  const { errors, busy, submit } = useReportForm(props);
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-4"
    >
      <p className="text-sm font-semibold text-slate-800">¿Por qué reporta este anuncio?</p>
      <Field id="reason" label="Motivo" error={errors.reason}>
        <select id="reason" name="reason" className={inputClass} defaultValue="">
          <option value="" disabled>
            Seleccione…
          </option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>
              {REPORT_REASON_LABELS[r]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="details" label="Detalles (opcional)" error={errors.details}>
        <textarea
          id="details"
          name="details"
          rows={3}
          maxLength={REPORT_DETAILS_MAX}
          className={inputClass}
        />
      </Field>
      {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" busy={busy}>
          Enviar reporte
        </Button>
        <Button variant="ghost" onClick={props.onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function ReportPanel(props: Omit<Props, "onReported"> & { onReported?: () => void }) {
  const [state, setState] = useState<"closed" | "open" | "sent">("closed");
  if (state === "sent") {
    return <Alert tone="success">Gracias. Un moderador revisará el anuncio.</Alert>;
  }
  if (state === "closed") {
    return (
      <button
        type="button"
        onClick={() => setState("open")}
        className="text-sm text-slate-500 underline hover:text-red-700"
      >
        Reportar este anuncio
      </button>
    );
  }
  const onReported = () => {
    setState("sent");
    props.onReported?.();
  };
  return <ReportForm {...props} onReported={onReported} onCancel={() => setState("closed")} />;
}
