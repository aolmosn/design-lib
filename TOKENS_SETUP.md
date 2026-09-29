# Carga de tokens CSS (@design-lib/tokens)

Este documento explica por qué `tokens.css` debe cargarse globalmente, qué pasa si no se hace, y cómo implementarlo en una arquitectura SPA y en microfrontends con single-spa.

---

## Por qué tokens.css debe cargarse globalmente

`tokens.css` define variables CSS en `:root` — el selector de máximo alcance del documento:

```css
:root {
  --ui-font-family: ui-sans-serif, system-ui, sans-serif;
  --ui-color-primary: #2563eb;
  --ui-space-4: 16px;
  /* ... */
}
```

Los componentes de la design-lib usan estas variables en sus estilos:

```css
/* Dentro de UiTextFieldComponent */
:host {
  font-family: var(--ui-font-family);
  color: var(--ui-color-text-primary);
}
```

Si `tokens.css` no está cargado cuando el componente renderiza, el browser no encuentra las variables y aplica el valor por defecto (`initial` o vacío). El resultado es que los componentes renderizan sin la tipografía, colores ni espaciado esperados.

### El problema en microfrontends

En single-spa el shell HTML existe antes de que cualquier MFE monte. Si los tokens no están en el shell, el período entre que la página carga y el MFE monta muestra estilos rotos. Además, cualquier elemento del shell (títulos, nav, layout) tampoco hereda la tipografía de la design-lib.

```
shell carga  →  título <h1> sin tokens  →  fuente del browser por defecto
     ↓
mf-form-demo monta  →  UiTextFieldComponent carga tokens  →  fuente correcta
     ↓
El usuario ve un salto visual entre el shell y los componentes
```

---

## Opciones de implementación

### Opción A — Inline en el HTML (recomendada sin CDN)

Copiar el contenido de `tokens.css` directamente en el HTML principal. Es la más simple y garantiza que los tokens estén disponibles antes de que cualquier script cargue.

**Para single-spa** — en `src/index.ejs`:

```html
<head>
  <!-- Fuente personalizada (si aplica) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Design tokens: variables CSS globales -->
  <style>
    :root {
      /* Tipografía */
      --ui-font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      --ui-font-size-xs: 0.75rem;
      --ui-font-size-sm: 0.875rem;
      --ui-font-size-md: 1rem;
      --ui-font-size-lg: 1.125rem;
      --ui-font-size-xl: 1.25rem;
      --ui-font-weight-normal: 400;
      --ui-font-weight-medium: 500;
      --ui-font-weight-semibold: 600;
      --ui-font-weight-bold: 700;
      --ui-line-height-tight: 1.25;
      --ui-line-height-normal: 1.5;
      --ui-line-height-loose: 1.75;

      /* Color */
      --ui-color-primary-50:  #eff6ff;
      --ui-color-primary-100: #dbeafe;
      --ui-color-primary-200: #bfdbfe;
      --ui-color-primary-500: #3b82f6;
      --ui-color-primary-600: #2563eb;
      --ui-color-primary-700: #1d4ed8;
      --ui-color-gray-50:  #f9fafb;
      --ui-color-gray-100: #f3f4f6;
      --ui-color-gray-200: #e5e7eb;
      --ui-color-gray-300: #d1d5db;
      --ui-color-gray-400: #9ca3af;
      --ui-color-gray-500: #6b7280;
      --ui-color-gray-700: #374151;
      --ui-color-gray-900: #111827;
      --ui-color-error-50:  #fef2f2;
      --ui-color-error-500: #ef4444;
      --ui-color-error-600: #dc2626;
      --ui-color-error-700: #b91c1c;
      --ui-color-success-500: #22c55e;
      --ui-color-success-600: #16a34a;
      --ui-color-primary:       var(--ui-color-primary-600);
      --ui-color-primary-hover: var(--ui-color-primary-700);
      --ui-color-primary-alpha: rgba(37, 99, 235, 0.2);
      --ui-color-error:       var(--ui-color-error-600);
      --ui-color-error-hover: var(--ui-color-error-700);
      --ui-color-error-alpha: rgba(220, 38, 38, 0.2);
      --ui-color-text-primary:   var(--ui-color-gray-900);
      --ui-color-text-secondary: var(--ui-color-gray-500);
      --ui-color-text-disabled:  var(--ui-color-gray-400);
      --ui-color-border:          var(--ui-color-gray-300);
      --ui-color-border-focus:    var(--ui-color-primary-600);
      --ui-color-border-error:    var(--ui-color-error-600);
      --ui-color-border-disabled: var(--ui-color-gray-200);
      --ui-color-surface:          #ffffff;
      --ui-color-surface-disabled: var(--ui-color-gray-50);
      --ui-color-surface-readonly: var(--ui-color-gray-50);

      /* Espaciado */
      --ui-space-0:  0px;
      --ui-space-1:  4px;
      --ui-space-2:  8px;
      --ui-space-3:  12px;
      --ui-space-4:  16px;
      --ui-space-5:  20px;
      --ui-space-6:  24px;
      --ui-space-8:  32px;
      --ui-space-10: 40px;
      --ui-space-12: 48px;

      /* Radio de borde */
      --ui-radius-sm:   4px;
      --ui-radius-md:   6px;
      --ui-radius-lg:   8px;
      --ui-radius-xl:   12px;
      --ui-radius-full: 9999px;

      /* Sombras */
      --ui-shadow-sm:            0 1px 2px rgba(0,0,0,0.05);
      --ui-shadow-md:            0 4px 6px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.06);
      --ui-shadow-focus-primary: 0 0 0 3px var(--ui-color-primary-alpha);
      --ui-shadow-focus-error:   0 0 0 3px var(--ui-color-error-alpha);

      /* Transiciones */
      --ui-transition-fast:   0.1s ease;
      --ui-transition-normal: 0.15s ease;
      --ui-transition-slow:   0.25s ease;
    }
  </style>
</head>
```

**Para SPA Angular** — en `src/styles.scss`:

```scss
// Fuente personalizada
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// Tokens de la design-lib
@import '@design-lib/tokens/src/tokens.css';

// Aplicar la fuente globalmente
* {
  font-family: var(--ui-font-family);
}
```

> Para que `@import '@design-lib/tokens/src/tokens.css'` funcione, el paquete debe estar instalado como dependencia. En un monorepo, se instala como `file:`:
> ```json
> "@design-lib/tokens": "file:../../design-lib/packages/tokens"
> ```

---

### Opción B — Servir tokens.css como archivo estático (recomendada con CDN o servidor propio)

Publicar `tokens.css` en una URL fija y cargarlo con `<link>`. Cuando se actualiza la design-lib, todos los proyectos reciben el cambio automáticamente sin tocar su código.

```html
<!-- En index.ejs o index.html -->
<link rel="stylesheet" href="https://mi-cdn.com/design-lib/tokens@0.1.0/tokens.css">
```

Esta es la estrategia equivalente a como se sirve Angular desde jsDelivr. Requiere un pipeline de publicación (npm registry privado + jsDelivr, S3, Cloudflare, etc.).

---

### Opción C — Importar en los estilos de cada MFE (no recomendada)

```scss
/* mf-form-demo/src/styles.scss */
@import '@design-lib/tokens/src/tokens.css';
```

El problema: los tokens solo están disponibles cuando ese MFE está montado. Si el shell renderiza algo antes de que el MFE cargue, aparece sin los estilos correctos. Además, si hay varios MFEs cada uno importa los tokens por separado (duplicación).

---

## Agregar una fuente personalizada

El token `--ui-font-family` en `tokens.css` actualmente usa fuentes del sistema:

```css
--ui-font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

Para usar una fuente personalizada hay que hacer dos cosas:

### 1. Actualizar el token en tokens.css

```css
/* design-lib/packages/tokens/src/tokens.css */

/* La directiva @import debe ir al inicio del archivo */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --ui-font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  /* ... resto de tokens */
}
```

### 2. Cargar la fuente en el HTML antes que cualquier script

El browser necesita conocer la fuente antes de renderizar el texto. Si se carga tarde, el usuario ve un flash de la fuente por defecto (FOUT — Flash of Unstyled Text):

```html
<!-- Orden correcto en <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<!-- tokens después, porque pueden referenciar la fuente ya declarada -->
<style>/* tokens inline */</style>
```

> `rel="preconnect"` inicia la conexión TCP/TLS con el servidor de Google Fonts antes de que el browser necesite el archivo, reduciendo la latencia de descarga.

---

## Por qué la fuente no aplicaba en el título (causa raíz)

En single-spa el HTML del shell se renderiza inmediatamente. Los MFEs se montan después, cuando single-spa procesa las rutas. Si los tokens solo se cargan cuando monta un MFE:

```
1. Browser renderiza index.ejs     → <h1> sin --ui-font-family → fuente del browser
2. single-spa monta mf-form-demo   → styles.scss inyecta tokens → componentes correctos
3. El <h1> del shell nunca se reestiliza porque ya fue pintado
```

Cargando los tokens en el `<head>` de `index.ejs` (antes de cualquier script), todos los elementos — shell y MFEs — parten del mismo estado visual.

---

## Resumen de la estrategia por arquitectura

| Arquitectura | Dónde cargar tokens.css | Dónde cargar la fuente |
|---|---|---|
| SPA Angular | `src/styles.scss` con `@import` | `src/styles.scss` con `@import url()` |
| single-spa shell | `src/index.ejs` — `<style>` inline o `<link>` | `src/index.ejs` — `<link rel="preconnect">` + `<link>` |
| MFE individual | No cargar — el shell ya los tiene | No cargar — el shell ya la tiene |
