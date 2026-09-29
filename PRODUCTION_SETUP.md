# Setup de producción — entorno bancario

Este documento describe cómo adaptar la arquitectura de la demo (que usa CDN público y `file:` dependencies) a un entorno bancario donde todo debe servirse desde infraestructura interna.

---

## Qué cambia respecto a la demo

| Recurso | Demo (desarrollo) | Producción (banco) |
|---|---|---|
| Paquetes npm | npmjs.com público | Registry interno (Artifactory / Nexus) |
| Angular, rxjs en import map | jsDelivr CDN público | CDN interno |
| single-spa, import-map-overrides | jsDelivr CDN público | CDN interno |
| Fuentes | Google Fonts | Self-hosted en CDN interno |
| Design-lib | `file:` local del monorepo | Versión publicada en registry interno |

La arquitectura no cambia — solo cambian las URLs y el origen de los paquetes.

---

## 1. Registry npm interno

### Configurar `.npmrc` en cada proyecto

```ini
# .npmrc — apuntar al registry interno
registry=https://registry.banco.com/npm/
```

Con esto `npm install` nunca sale a internet. El registry interno actúa como proxy auditado de npmjs.com y además aloja los paquetes propios de la design-lib.

### Publicar los paquetes de la design-lib

```bash
# En el monorepo design-lib, tras hacer el build
npm publish --registry https://registry.banco.com/npm/

# O con workspaces desde la raíz
npm publish -w packages/tokens   --registry https://registry.banco.com/npm/
npm publish -w packages/styles   --registry https://registry.banco.com/npm/
npm publish -w packages/angular  --registry https://registry.banco.com/npm/
npm publish -w packages/web-components --registry https://registry.banco.com/npm/
```

### Instalar en los proyectos consumidores

Los proyectos dejan de usar `file:` y referencian versiones reales:

```json
// package.json de cualquier MFE o SPA
{
  "dependencies": {
    "@design-lib/tokens":         "0.1.0",
    "@design-lib/styles":         "0.1.0",
    "@design-lib/angular":        "0.1.0",
    "@design-lib/web-components": "0.1.0"
  }
}
```

---

## 2. CDN interno — import map

### Subir los bundles al CDN interno

Los archivos que van al CDN son los bundles ESM de Angular y demás dependencias compartidas. Se pueden obtener de `node_modules` tras el `npm install`:

```
node_modules/@angular/core/fesm2022/core.mjs             → cdn.banco.com/angular/22.1.6/core.mjs
node_modules/@angular/core/fesm2022/primitives-signals.mjs → cdn.banco.com/angular/22.1.6/primitives-signals.mjs
node_modules/@angular/core/fesm2022/primitives-di.mjs    → cdn.banco.com/angular/22.1.6/primitives-di.mjs
node_modules/@angular/common/fesm2022/common.mjs         → cdn.banco.com/angular/22.1.6/common.mjs
node_modules/@angular/compiler/fesm2022/compiler.mjs     → cdn.banco.com/angular/22.1.6/compiler.mjs
node_modules/@angular/forms/fesm2022/forms.mjs           → cdn.banco.com/angular/22.1.6/forms.mjs
node_modules/@angular/platform-browser/fesm2022/platform-browser.mjs → cdn.banco.com/angular/22.1.6/platform-browser.mjs
node_modules/@angular/router/fesm2022/router.mjs         → cdn.banco.com/angular/22.1.6/router.mjs
node_modules/rxjs/dist/esm/index.js                      → cdn.banco.com/rxjs/7.8.2/index.js
node_modules/rxjs/dist/esm/operators/index.js            → cdn.banco.com/rxjs/7.8.2/operators.js
node_modules/single-spa/lib/es2015/esm/single-spa.min.js → cdn.banco.com/single-spa/6.0.3/single-spa.min.js
node_modules/import-map-overrides/dist/import-map-overrides.js → cdn.banco.com/import-map-overrides/5.1.1/import-map-overrides.js
node_modules/@single-spa/import-map-injector/lib/import-map-injector.js → cdn.banco.com/import-map-injector/2.0.1/import-map-injector.js
```

### Actualizar src/index.ejs

```html
<!-- src/index.ejs -->

<!-- Fuente self-hosted (ver sección 3) -->
<style>
  @font-face {
    font-family: 'Inter';
    font-weight: 400;
    font-display: swap;
    src: url('https://cdn.banco.com/fonts/inter-400.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Inter';
    font-weight: 500;
    font-display: swap;
    src: url('https://cdn.banco.com/fonts/inter-500.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Inter';
    font-weight: 600;
    font-display: swap;
    src: url('https://cdn.banco.com/fonts/inter-600.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Inter';
    font-weight: 700;
    font-display: swap;
    src: url('https://cdn.banco.com/fonts/inter-700.woff2') format('woff2');
  }
</style>

<!-- Tokens CSS: reemplazar <style> inline por link al CDN interno -->
<link rel="stylesheet" href="https://cdn.banco.com/design-lib/tokens/0.1.0/tokens.css">

<script type="injector-importmap">
  {
    "imports": {
      "single-spa":                        "https://cdn.banco.com/single-spa/6.0.3/single-spa.min.js",
      "@angular/core":                     "https://cdn.banco.com/angular/22.1.6/core.mjs",
      "@angular/core/primitives/signals":  "https://cdn.banco.com/angular/22.1.6/primitives-signals.mjs",
      "@angular/core/primitives/di":       "https://cdn.banco.com/angular/22.1.6/primitives-di.mjs",
      "@angular/common":                   "https://cdn.banco.com/angular/22.1.6/common.mjs",
      "@angular/compiler":                 "https://cdn.banco.com/angular/22.1.6/compiler.mjs",
      "@angular/forms":                    "https://cdn.banco.com/angular/22.1.6/forms.mjs",
      "@angular/platform-browser":         "https://cdn.banco.com/angular/22.1.6/platform-browser.mjs",
      "@angular/router":                   "https://cdn.banco.com/angular/22.1.6/router.mjs",
      "rxjs":                              "https://cdn.banco.com/rxjs/7.8.2/index.js",
      "rxjs/operators":                    "https://cdn.banco.com/rxjs/7.8.2/operators.js"
    }
  }
</script>

<script src="https://cdn.banco.com/import-map-overrides/5.1.1/import-map-overrides.js"></script>
<script src="https://cdn.banco.com/import-map-injector/2.0.1/import-map-injector.js"></script>
```

---

## 3. Fuentes self-hosted

### Descargar los archivos de fuente

Los archivos `.woff2` se descargan una vez y se suben al CDN interno. Para Inter:

```bash
# Descargar desde Google Fonts o fonts.google.com/specimen/Inter
# Pesos necesarios: 400, 500, 600, 700
inter-400.woff2
inter-500.woff2
inter-600.woff2
inter-700.woff2
```

Se suben a `cdn.banco.com/fonts/` y se referencian con `@font-face` en el `<style>` del shell (ver sección 2).

### Actualizar tokens.css

En lugar del `@import url(Google Fonts)`, `tokens.css` declara directamente la familia — los `@font-face` viven en el shell:

```css
/* design-lib/packages/tokens/src/tokens.css */
:root {
  /* La fuente ya fue declarada con @font-face en el shell */
  --ui-font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

---

## 4. Tokens CSS en el CDN interno

Cuando `tokens.css` tiene una URL pública en el CDN interno, el `<style>` inline del shell se reemplaza por un `<link>`:

```html
<!-- Antes: tokens inline en index.ejs (válido pero requiere sync manual) -->
<style>:root { --ui-font-family: 'Inter'... }</style>

<!-- Después: link al CDN interno (se actualiza solo con cada release) -->
<link rel="stylesheet" href="https://cdn.banco.com/design-lib/tokens/0.1.0/tokens.css">
```

El proceso de release de la design-lib sube `tokens.css` al CDN como parte del pipeline CI/CD.

---

## 5. Pipeline CI/CD sugerido para la design-lib

```
git push → main
    ↓
CI build
  ├── npm run build (ng-packagr para @design-lib/angular)
  ├── tests
  └── bump de versión (semver)
    ↓
Publicación
  ├── npm publish → registry interno (todos los paquetes)
  └── upload CDN → tokens.css, bundles si aplica
    ↓
Notificación a equipos consumidores (Slack, email, changelog)
```

---

## 6. Uso de @design-lib/styles en producción

Con el registry interno configurado, instalar y usar el paquete de utilidades es idéntico a cualquier dependencia:

```bash
npm install @design-lib/styles
```

```scss
// src/styles.scss de cualquier MFE o SPA
@use '@design-lib/styles';

// O solo los mixins de breakpoints
@use '@design-lib/styles/mixins' as ui;

.mi-componente {
  @include ui.respond-to('md') {
    flex-direction: row;
  }
}
```

```html
<!-- En templates, usar las clases directamente -->
<div class="flex-col gap-16 md:flex-row lg:flex-row">
  <h1 class="title-text">Título</h1>
  <p class="body-text color-text-secondary">Descripción</p>
</div>
```
