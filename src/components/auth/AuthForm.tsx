"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { FieldErrors } from "@/domain/listing";
import { errorMessage } from "@/lib/errors";
import { allowedEmailDomain } from "@/lib/firebase";
import { register, signIn, validateRegistration } from "@/services/auth";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";

type Mode = "login" | "register";

function useAuthForm(mode: Mode) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  async function send(raw: Record<"email" | "password" | "displayName", string>) {
    if (mode === "login") {
      await signIn(raw);
      return null;
    }
    const result = validateRegistration(raw);
    if (!result.ok) return result.errors;
    await register(result.value);
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (k: string) => String(data.get(k) ?? "");
    setBusy(true);
    setErrors({});
    try {
      const fieldErrors = await send({
        email: text("email"),
        password: text("password"),
        displayName: text("displayName"),
      });
      if (fieldErrors) return setErrors(fieldErrors);
      router.push("/");
    } catch (e) {
      setErrors({ form: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }
  return { errors, busy, submit };
}

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const { errors, busy, submit } = useAuthForm(mode);
  const isRegister = mode === "register";
  return (
    <form
      onSubmit={(e) => void submit(e)}
      noValidate
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {isRegister ? (
        <Field id="displayName" label="Nombre" error={errors.displayName}>
          <input id="displayName" name="displayName" autoComplete="name" className={inputClass} />
        </Field>
      ) : null}
      <Field
        id="email"
        label="Correo institucional"
        error={errors.email}
        hint={allowedEmailDomain ? `@${allowedEmailDomain}` : undefined}
      >
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
      </Field>
      <Field id="password" label="Contraseña" error={errors.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          className={inputClass}
        />
      </Field>
      {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
      <Button type="submit" busy={busy} className="w-full">
        {isRegister ? "Crear cuenta" : "Ingresar"}
      </Button>
      <button
        type="button"
        onClick={() => setMode(isRegister ? "login" : "register")}
        className="w-full text-sm text-brand-700 underline"
      >
        {isRegister ? "¿Ya tiene cuenta? Ingrese" : "¿No tiene cuenta? Regístrese"}
      </button>
    </form>
  );
}
