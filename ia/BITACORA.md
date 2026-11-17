# Bitácora de uso de IA

Formato por entrada: **propósito · evidencia · validación · decisión**.
Las entradas marcadas "Rechazo/corrección" documentan qué propuso la IA y por qué se cambió.

> El proyecto se generó con un asistente de IA en Cursor (2026-11-17). La persona
> responsable debe revisar cada entrada y añadir las suyas en las siguientes sesiones.

## 2026-11-17 · Configuración inicial

- **Propósito**: configurar las barreras antes de generar código.
- **Evidencia**: commit `b33e33a` (`chore: configuración de IA, seguridad y calidad…`).
- **Validación**: `npm run test:hooks` con 15 de 15 en verde. En vivo en Cursor quedaron bloqueados
  `ls ..`, la lectura de `.env.local` y `grep -r CANARIO .`.
- **Decisión**: se usa un solo hook (`guard.mjs`) para Claude Code y Cursor.

## Rechazo/corrección 1 · TypeScript 7

- **Propuso**: instalar `typescript@latest` (7.0.2).
- **Problema**: `npm ls` marcó `invalid`, porque `typescript-eslint` exige `<6.1.0`. El lint habría fallado o dado falsos negativos.
- **Decisión**: fijar `typescript@6.0.3`.

## Rechazo/corrección 2 · Vulnerabilidades en `firebase`

- **Propuso** `npm audit`: `npm audit fix --force`, que **bajaría `firebase` a 9.14.0** (un cambio mayor que rompe la API).
- **Decisión**: rechazado. Se usó `overrides` para forzar `@grpc/grpc-js@^1.14.7`.
  Las dependencias de producción quedaron con 0 vulnerabilidades.

## Rechazo/corrección 3 · Canario en la plantilla

- **Propuso**: `env.example` con `CANARIO=<valor real del canario>`.
- **Problema**: el archivo se versiona, así que `grep` sobre el repo habría revelado el valor y la prueba 3 perdería sentido.
- **Detectado**: al ejecutar la prueba 3 y buscar el valor con la herramienta Grep.
- **Decisión**: se cambió por un marcador. Como el valor ya está en el historial, hay que cambiarlo en `.env.local`.

## Rechazo/corrección 4 · Datos de prueba de búsqueda

- **Propuso**: una prueba de `filterListings` que usaba la descripción por defecto del fixture.
- **Problema**: la prueba falló porque esa descripción contiene "cálculo" y la bicicleta también coincidía.
  El error estaba en la prueba, no en el código.
- **Decisión**: cada anuncio de la prueba tiene su propia descripción. **No** se cambió la
  aserción para que pasara.

## Corrección 5 · Contacto del vendedor

- **Detectado**: el modelo inicial no tenía forma de contactar al vendedor.
- **Proceso**: primero la prueba que falla (`exige un medio de contacto`), luego el dominio,
  las reglas de Firestore y el seed (commit `feat: medio de contacto…`).
- **Decisión**: el texto de ayuda propuesto decía "visible solo con sesión", pero las reglas
  permiten leer el documento publicado. Se cambió por "Será visible en el anuncio publicado"
  para no prometer una privacidad que el backend no garantiza.

## Plantilla

```md
## AAAA-MM-DD · Tarea

- **Propósito**:
- **Prompt (resumen)**:
- **Evidencia**: commit / captura / salida de `npm run check`
- **Validación**: pruebas que fallaron antes y pasan después
- **Decisión**: aceptado / modificado / rechazado y por qué
```
