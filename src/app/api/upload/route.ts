import { handleUpload } from "@vercel/blob/client";
import { z } from "zod";
import { ALLOWED_PHOTO_TYPES, LISTING_LIMITS } from "@/domain/listing";
import { photoOwnerUid } from "@/domain/photos";
import type { Viewer } from "@/domain/permissions";
import { viewerFromRequest } from "@/lib/server-auth";

const tokenRequestSchema = z.object({
  type: z.literal("blob.generate-client-token"),
  payload: z.object({
    pathname: z.string().min(1),
    multipart: z.boolean(),
    clientPayload: z.string().nullable(),
  }),
});

class UploadRejected extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function fail(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function authorizePathname(viewer: Viewer | null, pathname: string) {
  if (viewer === null) throw new UploadRejected("Debe iniciar sesión para subir fotos", 401);
  if (photoOwnerUid(pathname) !== viewer.uid) {
    throw new UploadRejected("Ruta de subida no permitida", 403);
  }
  return Promise.resolve({
    allowedContentTypes: [...ALLOWED_PHOTO_TYPES],
    maximumSizeInBytes: LISTING_LIMITS.photoMaxBytes,
    addRandomSuffix: false,
    allowOverwrite: false,
  });
}

export async function POST(request: Request): Promise<Response> {
  const parsed = tokenRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Solicitud de subida inválida", 400);

  const viewer = await viewerFromRequest(request);
  try {
    const result = await handleUpload({
      body: parsed.data,
      request,
      onBeforeGenerateToken: (pathname) => authorizePathname(viewer, pathname),
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof UploadRejected) return fail(error.message, error.status);
    return fail("No fue posible preparar la subida de fotos. Intente de nuevo", 502);
  }
}
