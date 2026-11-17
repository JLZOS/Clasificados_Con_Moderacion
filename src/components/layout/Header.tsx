"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { signOut } from "@/services/auth";

interface NavItem {
  href: string;
  label: string;
  requires: "none" | "user" | "moderator";
}

const NAV: NavItem[] = [
  { href: "/", label: "Explorar", requires: "none" },
  { href: "/publicar", label: "Publicar", requires: "user" },
  { href: "/favoritos", label: "Favoritos", requires: "user" },
  { href: "/mis-anuncios", label: "Mis anuncios", requires: "user" },
  { href: "/moderacion", label: "Moderación", requires: "moderator" },
];

function NavLinks() {
  const pathname = usePathname();
  const { user } = useAuth();
  const visible = NAV.filter(
    (item) =>
      item.requires === "none" ||
      (item.requires === "user" && user) ||
      (item.requires === "moderator" && user?.role === "moderator"),
  );
  return (
    <nav aria-label="Principal" className="flex flex-wrap gap-1">
      {visible.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-800"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function UserArea() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <ButtonLink href="/ingresar">Ingresar</ButtonLink>;
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-slate-600 sm:inline">
        {user.displayName}
        {user.role === "moderator" ? " · Moderador" : ""}
      </span>
      <Button variant="secondary" onClick={() => void signOut()}>
        Salir
      </Button>
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="rounded-md bg-brand-700 px-2 py-1 text-sm text-white">CM</span>
          Clasificados
        </Link>
        <NavLinks />
        <UserArea />
      </div>
    </header>
  );
}
