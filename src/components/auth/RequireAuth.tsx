"use client";

import type { ReactNode } from "react";
import type { Role } from "@/domain/permissions";
import type { AppUser } from "@/services/auth";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, EmptyState, Spinner } from "@/components/ui/Feedback";
import { useAuth } from "./AuthProvider";

interface RequireAuthProps {
  role?: Role;
  children: (user: AppUser) => ReactNode;
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Verificando sesión…" />;
  if (!user) {
    return (
      <EmptyState
        title="Inicie sesión para continuar"
        description="Esta sección es solo para estudiantes registrados."
        action={<ButtonLink href="/ingresar">Ingresar</ButtonLink>}
      />
    );
  }
  if (role && user.role !== role) {
    return <Alert tone="error">No tiene permisos para ver esta sección.</Alert>;
  }
  return <>{children(user)}</>;
}
