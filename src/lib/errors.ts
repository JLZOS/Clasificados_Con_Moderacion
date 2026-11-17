const MESSAGES: Record<string, string> = {
  "permission-denied": "No tiene permisos para esta acción o el contenido no está disponible",
  unavailable: "Sin conexión con Firebase (¿están corriendo los emuladores?)",
  "failed-precondition": "Falta un índice o la operación no es válida en este momento",
  "storage/unauthorized":
    "No tiene permiso para subir esa foto (solo JPG, PNG o WebP de hasta 5 MB)",
  "storage/retry-limit-exceeded": "No fue posible subir las fotos. Intente de nuevo",
  "auth/invalid-credential": "Correo o contraseña incorrectos",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo",
  "auth/too-many-requests": "Demasiados intentos. Espere un momento",
  "auth/network-request-failed": "Sin conexión con el servidor (¿están corriendo los emuladores?)",
};

const GENERIC = "No fue posible completar la operación. Intente de nuevo";

function errorCode(error: Error): string {
  return "code" in error ? String(error.code) : "";
}

export function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return GENERIC;
  const code = errorCode(error);
  if (code === "") return error.message || GENERIC;
  return MESSAGES[code] ?? GENERIC;
}
