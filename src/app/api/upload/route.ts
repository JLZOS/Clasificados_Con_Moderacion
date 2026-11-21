import { put } from "@vercel/blob";
import { validatePhotos } from "@/domain/listing";
import { photoPathname, photoProxyUrl } from "@/domain/photos";
import { viewerFromRequest } from "@/lib/server-auth";

function fail(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const viewer = await viewerFromRequest(request);
  if (viewer === null) return fail("Debe iniciar sesión para subir fotos", 401);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const listingId = form?.get("listingId");
  const index = Number(form?.get("index"));
  if (!(file instanceof File) || typeof listingId !== "string") {
    return fail("Solicitud de subida inválida", 400);
  }

  const errors = validatePhotos([file]);
  if (errors.length > 0) return fail(errors.join(" · "), 400);

  const pathname = photoPathname(viewer.uid, listingId, index, file.name);
  if (pathname === null) return fail("Solicitud de subida inválida", 400);

  try {
    const blob = await put(pathname, file, { access: "private", contentType: file.type });
    return Response.json({ url: photoProxyUrl(blob.pathname) }, { status: 201 });
  } catch {
    return fail("No fue posible subir las fotos. Intente de nuevo", 502);
  }
}
