import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { PageHeader } from "@/components/ui/Feedback";

export const metadata: Metadata = { title: "Ingresar" };

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Ingresar" subtitle="Use su correo institucional para comprar y vender." />
      <AuthForm />
    </div>
  );
}
