# Clasificados con moderación

Compra y venta entre estudiantes con fotos, favoritos, reportes y panel de moderación.

- Cualquier estudiante con correo institucional publica anuncios (1 a 5 fotos).
- Un anuncio nuevo queda **en revisión** hasta que un moderador lo aprueba o lo rechaza con un motivo.
- Los estudiantes guardan **favoritos** y **reportan** anuncios. Con **3 reportes** el anuncio
  se oculta automáticamente hasta que un moderador lo revise.
- El vendedor marca su anuncio como vendido o lo elimina.
- El **panel de moderación** tiene cuatro colas: pendientes, reportes abiertos, ocultos y
  publicados. Cada decisión queda registrada en `moderationLog`.

La configuración de IA y sus evidencias están en [`IA.md`](IA.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 6 (`strict`) · Tailwind CSS 4 ·
Firebase (Auth, Firestore) con Emulator Suite · Vercel Blob privado (fotos) · Zod · Vitest ·
ESLint 10 · Prettier.

## Requisitos

- Node.js 22.12 o superior (probado con 24; ver `.nvmrc`). Con nvm-windows: `nvm install 24 && nvm use 24`.
  `.npmrc` tiene `engine-strict=true`, así que `npm` rechaza versiones viejas con un mensaje claro.
  Node 20.18 o anterior falla con `require() of ES Module … magic-string` (lo usa Tailwind 4).
- Java 21 o superior para el Firebase Emulator Suite.
- Para el sandbox de Claude Code: WSL2 con `bubblewrap` y `socat` (ver `ia/CONFIGURACION.md`).

## Puesta en marcha

```bash
npm ci
cp env.example .env.local          # valores falsos de desarrollo; agregue su CANARIO y BLOB_READ_WRITE_TOKEN
npm run emulators                  # terminal 1: Auth 9099, Firestore 8080, UI 4000
npm run seed                       # terminal 2: usuarios y anuncios de ejemplo
npm run dev                        # http://localhost:3000
```

Usuarios de ejemplo (solo existen en el emulador; contraseña `Clasificados123!`):

| Correo                         | Rol                                   |
| ------------------------------ | ------------------------------------- |
| `moderador@universidad.edu.co` | Moderador (claim `role: "moderator"`) |
| `ana@universidad.edu.co`       | Estudiante                            |
| `luis@universidad.edu.co`      | Estudiante                            |

## Scripts

| Script                               | Qué hace                                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `npm run check`                      | `typecheck` + `lint` + `format:check` + `test` + `test:hooks`. Si falla, la tarea no está terminada |
| `npm run test`                       | Vitest con cobertura v8; el umbral del 80 % sobre `src/domain` rompe el check                       |
| `npm run test:hooks`                 | 15 pruebas `node:test` del hook de seguridad de la IA                                               |
| `npm run build`                      | Build de producción                                                                                 |
| `npm run emulators` / `npm run seed` | Firebase local y datos de ejemplo                                                                   |

Husky: `pre-commit` corre lint-staged (Prettier + ESLint en lo modificado), `commit-msg`
corre commitlint (commits convencionales) y `pre-push` corre `npm run check`.

## Arquitectura

```text
src/
  domain/      Lógica de negocio pura y probada (validación, estados, reportes, permisos, búsqueda)
  services/    Firebase ↔ dominio (Firestore, Auth) y llamadas a /api para fotos; valida con Zod
  lib/         Inicialización de Firebase, verificación del ID token en el servidor y errores
  hooks/       useAsync
  components/  UI (ui/, listings/, moderation/, auth/, layout/)
  app/         Rutas: /, /anuncios/[id], /publicar, /favoritos, /mis-anuncios, /moderacion, /ingresar
               API: POST /api/upload, GET y DELETE /api/blob (fotos en Vercel Blob privado)
firestore.rules                  Autorización real del backend (datos)
scripts/seed.ts                  Datos de ejemplo (solo proyecto demo-*)
```

Estados de un anuncio:

```text
pending ──aprobar──▶ approved ──3 reportes──▶ hidden ──restaurar──▶ approved
   │                    │  └──vendedor──▶ sold
   └──rechazar──▶ rejected ◀──rechazar── (approved | hidden)
```

### Modelo de datos (Firestore)

- `listings/{id}`: título, descripción, precio (entero COP), categoría, estado del artículo,
  contacto, `photoUrls`, `sellerId`, `status`, `reportCount`, `moderationNote` y fechas.
- `reports/{listingId_uid}`: un reporte por usuario y anuncio (el ID lo garantiza).
- `moderationLog/{id}`: auditoría de cada decisión de moderación.
- `users/{uid}/favorites/{listingId}`.

### Seguridad del backend

`firestore.rules` replica las reglas del dominio. Solo el dueño crea anuncios, y siempre en
`pending`. Solo un moderador (custom claim) cambia el estado. Un reporte incrementa
`reportCount` en exactamente 1 y debe crear su documento en la misma transacción
(`existsAfter`/`getAfter`). Con 3 reportes el estado tiene que pasar a `hidden`.
Las fotos viven en un Blob Store **privado** de Vercel y se suben con _client upload_: el
navegador envía el archivo directo a Vercel Blob, nunca a la función. `POST /api/upload` solo
firma el token (`handleUpload`). Antes verifica el ID token de Firebase y exige que la ruta sea
`listings/{uid del token}/{listingId}/`. El token admite solo JPG, PNG o WebP de hasta 5 MB. `GET /api/blob?pathname=…` sirve solo rutas con ese
formato (nunca URLs arbitrarias). `DELETE /api/blob` lo permite solo al dueño o a un moderador.
En Firestore, `photoUrls` guarda la ruta del proxy (`/api/blob?pathname=…`).

Límites conocidos: el dominio institucional del correo se valida en el cliente (no en las
reglas). Las fotos son públicas si se conoce su URL. El contacto de un anuncio publicado
es legible por cualquiera.

## Dependencias (justificación)

| Paquete                                              | Por qué                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `next`, `react`, `react-dom`                         | Framework y UI exigidos por el curso                                     |
| `firebase`                                           | Auth y Firestore desde el cliente                                        |
| `@vercel/blob`                                       | Subir, servir (proxy) y borrar fotos en un Blob Store privado            |
| `zod`                                                | Validación compartida entre formularios y lectura de Firestore, sin `as` |
| `typescript` (6.0.x)                                 | Tipado estricto; fijado a 6.0 porque `typescript-eslint` no soporta 7    |
| `eslint`, `eslint-config-next`                       | Lint con reglas de Next y TypeScript (flat config)                       |
| `prettier`                                           | Formato automático                                                       |
| `vitest`, `@vitest/coverage-v8`                      | Pruebas y cobertura con umbral                                           |
| `husky`, `lint-staged`                               | Hooks de Git: formato y lint en commit, check en push                    |
| `@commitlint/cli`, `@commitlint/config-conventional` | Commits convencionales obligatorios                                      |
| `tailwindcss`, `@tailwindcss/postcss`                | Estilos utilitarios                                                      |
| `firebase-tools`                                     | Emulator Suite local (sin credenciales reales)                           |
| `firebase-admin`                                     | `verifyIdToken` en `/api/*` y `scripts/seed.ts` contra el emulador       |
| `tsx`                                                | Ejecutar el seed en TypeScript                                           |

`overrides`: `@grpc/grpc-js@^1.14.7` corrige 4 vulnerabilidades altas que traía `firebase`.
`@vercel/cli-config` → `zod: $zod` usa el `zod` 4.x del proyecto en lugar del 4.1.11 vulnerable
(GHSA-mrhx-c7xc-m3w5) que trae `@vercel/blob` vía `@vercel/oidc`.

### Auditoría

`npm audit --omit=dev --audit-level=high` da **0 vulnerabilidades** y es bloqueante en CI.
La auditoría completa reporta avisos en herramientas de desarrollo (`picomatch` vía ESLint
y Vitest, y `re2` vía `firebase-tools`) que hoy no tienen versión corregida. Se ejecuta en
CI como informativa y no llega al bundle de producción.

## Despliegue

Vercel (rama `main`) con las variables `NEXT_PUBLIC_FIREBASE_*` de un proyecto real
configuradas **solo en Vercel**, más `BLOB_READ_WRITE_TOKEN` (la agrega Vercel al conectar el
Blob Store `clasificados-media`). Antes de desplegar las reglas, haga `firebase deploy --only firestore`
manualmente: la IA lo tiene denegado.
