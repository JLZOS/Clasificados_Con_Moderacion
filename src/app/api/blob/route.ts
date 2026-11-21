import { del, get, list } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { canDeletePhotos, isListingPhotoPathname, listingPhotoPrefix } from "@/domain/photos";
import { viewerFromRequest } from "@/lib/server-auth";

const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400";

function fail(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

export async function GET(request: NextRequest): Promise<Response> {
  const pathname = request.nextUrl.searchParams.get("pathname");
  if (!isListingPhotoPathname(pathname)) return fail("Ruta de imagen inválida", 400);

  const result = await get(pathname, {
    access: "private",
    ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
  }).catch(() => null);
  if (result === null) return fail("Imagen no encontrada", 404);

  const headers = { ETag: result.blob.etag, "Cache-Control": CACHE_CONTROL };
  if (result.statusCode === 304) return new Response(null, { status: 304, headers });
  return new Response(result.stream, {
    headers: { ...headers, "Content-Type": result.blob.contentType },
  });
}

export async function DELETE(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const sellerId = params.get("sellerId") ?? "";
  const prefix = listingPhotoPrefix(sellerId, params.get("listingId") ?? "");
  if (prefix === null) return fail("Solicitud inválida", 400);

  const viewer = await viewerFromRequest(request);
  if (!canDeletePhotos(viewer, sellerId))
    return fail("No tiene permiso para borrar estas fotos", 403);

  try {
    const { blobs } = await list({ prefix });
    if (blobs.length > 0) await del(blobs.map((blob) => blob.url));
    return new Response(null, { status: 204 });
  } catch {
    return fail("No fue posible borrar las fotos. Intente de nuevo", 502);
  }
}
