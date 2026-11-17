import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";

export default function NotFound() {
  return (
    <EmptyState
      title="Página no encontrada"
      description="La dirección no existe o el contenido fue eliminado."
      action={<ButtonLink href="/">Volver al inicio</ButtonLink>}
    />
  );
}
