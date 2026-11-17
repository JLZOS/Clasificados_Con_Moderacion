import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Clasificados con moderación", template: "%s · Clasificados" },
  description: "Compra y venta entre estudiantes con fotos, favoritos, reportes y moderación.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <AuthProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            Clasificados con moderación · Proyecto académico de Desarrollo Web
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
