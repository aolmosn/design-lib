# `ui-kebab-container` / `ui-kebab-option`

Menú contextual tipo kebab (⋮). Al hacer click en el ícono se despliega una lista de opciones posicionada inteligentemente respecto al trigger — debajo por defecto, arriba si no hay espacio. Se cierra al seleccionar una opción o al hacer click fuera.

El componente tiene dos partes: el **contenedor** (`ui-kebab-container`) que maneja el estado y el posicionamiento, y las **opciones** (`ui-kebab-option`) que van como hijos en el slot.

---

## Índice

1. [Propiedades y métodos del contenedor](#1-propiedades-y-métodos-del-contenedor)
2. [Propiedades de la opción](#2-propiedades-de-la-opción)
3. [Eventos](#3-eventos)
4. [Uso básico en Angular](#4-uso-básico-en-angular)
5. [Trigger externo](#5-trigger-externo)
6. [Manejar la selección de una opción](#6-manejar-la-selección-de-una-opción)
7. [Posicionamiento automático](#7-posicionamiento-automático)
8. [Instalación y paths](#8-instalación-y-paths)

---

## 1. Propiedades y métodos del contenedor

### Propiedades (`ui-kebab-container`)

| Propiedad       | Tipo              | Default | Descripción                                                   |
|-----------------|-------------------|---------|---------------------------------------------------------------|
| `hideList`      | `boolean`         | `true`  | Controla si la lista está visible. `true` = cerrado           |
| `triggerElement`| `Element \| null` | `null`  | Elemento externo que actúa como trigger. Si es `null`, usa el ícono ⋮ interno |

### Métodos públicos

| Método               | Descripción                                                               |
|----------------------|---------------------------------------------------------------------------|
| `show()`             | Abre el menú, calcula la posición y empieza a trackear scroll/resize      |
| `hide()`             | Cierra el menú y detiene el tracking                                      |
| `toggle()`           | Alterna entre abierto y cerrado                                           |
| `setTrigger(el)`     | Asigna un elemento externo como trigger (reemplaza el ícono ⋮ interno)    |

---

## 2. Propiedades de la opción

### Propiedades (`ui-kebab-option`)

| Propiedad | Atributo HTML | Tipo     | Default | Descripción                                     |
|-----------|---------------|----------|---------|-------------------------------------------------|
| `icon`    | `icon`        | `string` | `''`    | Nombre del ícono de Material Icons (ej. `'download'`) |

El texto de la opción se pasa como contenido del elemento (slot):

```html
<ui-kebab-option icon="download">Descargar Excel</ui-kebab-option>
```

---

## 3. Eventos

### Eventos que emite `ui-kebab-option`

| Evento      | `detail` | Cuándo se emite                    |
|-------------|----------|------------------------------------|
| `ui-select` | `{}`     | El usuario hace click en la opción |

El evento viaja con `bubbles: true, composed: true`. El contenedor lo escucha y cierra el menú automáticamente — no es necesario manejarlo para el cierre.

---

## 4. Uso básico en Angular

### Importar los componentes

```ts
import { UiKebab, UiKebabOption } from '@design-lib/angular/kebab';

@Component({
  standalone: true,
  imports: [UiKebab, UiKebabOption],
  templateUrl: './demo.component.html',
})
export class DemoComponent {}
```

### Template mínimo

```html
<ui-kebab-container>
  <ui-kebab-option icon="content_copy">Copiar</ui-kebab-option>
  <ui-kebab-option icon="download">Descargar Excel</ui-kebab-option>
  <ui-kebab-option icon="picture_as_pdf">Descargar PDF</ui-kebab-option>
</ui-kebab-container>
```

Al hacer click en el ícono ⋮ se abre la lista. Al hacer click en cualquier opción o fuera del menú, se cierra.

---

## 5. Trigger externo

Por defecto el componente muestra su propio ícono ⋮ como trigger. Si ya tenés un botón propio (por ejemplo, en el header de una tabla), podés asignarlo como trigger externo para que el ícono interno no se renderice.

```html
<button #miBoton (click)="kebab.toggle()">Acciones ▼</button>

<ui-kebab-container #kebab>
  <ui-kebab-option icon="edit">Editar</ui-kebab-option>
  <ui-kebab-option icon="delete">Eliminar</ui-kebab-option>
</ui-kebab-container>
```

```ts
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { UiKebab, UiKebabOption } from '@design-lib/angular/kebab';

@Component({
  standalone: true,
  imports: [UiKebab, UiKebabOption],
  templateUrl: './demo.component.html',
})
export class DemoComponent implements AfterViewInit {
  @ViewChild('kebab',   { read: ElementRef }) kebabRef!: ElementRef;
  @ViewChild('miBoton', { read: ElementRef }) botonRef!: ElementRef;

  ngAfterViewInit(): void {
    // Registrar el botón como trigger para que el posicionamiento
    // se calcule respecto a él, y no al ícono interno
    this.kebabRef.nativeElement.setTrigger(this.botonRef.nativeElement);
  }
}
```

> **Por qué `{ read: ElementRef }`:** cuando el selector de un `@ViewChild` coincide con un componente Angular, Angular devuelve la instancia del componente por defecto, no el elemento DOM. Con `{ read: ElementRef }` se obtiene el `HTMLElement` nativo que necesita Lit.

---

## 6. Manejar la selección de una opción

El cierre del menú es automático. Para ejecutar lógica al seleccionar una opción, hay dos formas:

### Opción A: click en la opción directamente (más simple)

```html
<ui-kebab-container>
  <ui-kebab-option icon="edit"   (click)="editar()">Editar</ui-kebab-option>
  <ui-kebab-option icon="delete" (click)="eliminar()">Eliminar</ui-kebab-option>
</ui-kebab-container>
```

```ts
editar():   void { /* ... */ }
eliminar(): void { /* ... */ }
```

### Opción B: escuchar `ui-select` en el contenedor

Útil cuando el contenedor se genera dinámicamente y no se puede poner el handler en cada opción por separado.

```html
<ui-kebab-container #kebab></ui-kebab-container>
```

```ts
@ViewChild('kebab', { read: ElementRef }) kebabRef!: ElementRef;

ngAfterViewInit(): void {
  this.kebabRef.nativeElement.addEventListener('ui-select', (e: Event) => {
    console.log('opción seleccionada', e);
  });
}
```

---

## 7. Posicionamiento automático

El componente usa `ElementPositioner` (utilidad interna de `@design-lib/web-components`) para calcular y mantener la posición del menú.

### Comportamiento

| Situación | Resultado |
|---|---|
| Hay espacio debajo del trigger | El menú se abre debajo |
| No hay espacio debajo | El menú se abre arriba |
| El menú se sale por la izquierda | Se alinea al borde izquierdo del trigger |
| Por defecto | Se alinea al borde derecho del trigger |

### Atributos de diagnóstico

Cuando el menú está abierto, el elemento `.kebab-list` recibe atributos de datos con el placement resultante:

```html
<!-- Ejemplo: menú abierto abajo-derecha -->
<ul class="kebab-list" data-placement-v="bottom" data-placement-h="end">
```

| Atributo | Valores | Significado |
|---|---|---|
| `data-placement-v` | `top` / `bottom` | El menú quedó arriba o abajo del trigger |
| `data-placement-h` | `start` / `end`  | El menú está alineado a la izquierda o derecha |

Estos atributos se pueden usar en CSS para apuntar una flecha o sombra:

```css
ui-kebab-container .kebab-list[data-placement-v="top"] {
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
}
```

### Tracking automático

Mientras el menú está abierto, `ElementPositioner` recalcula la posición:
- Cuando el trigger cambia de tamaño (`ResizeObserver`)
- En cada evento `scroll` de cualquier ancestro (`window scroll capture`)
- En `resize` de la ventana

Al cerrar (`hide()`), el tracking se detiene y los listeners se limpian.

---

## 8. Instalación y paths

### `tsconfig.json` del proyecto consumidor

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@design-lib/angular/kebab": [
        "../design-lib/packages/angular/src/lib/kebab/index.ts"
      ],
      "@design-lib/web-components/kebab": [
        "../design-lib/packages/web-components/src/components/kebab/index.ts"
      ]
    }
  }
}
```

### Estructura de archivos del componente

```
packages/
├── web-components/src/components/kebab/
│   ├── kebab.ts            ← Lit: UiKebabContainer
│   ├── kebab-option.ts     ← Lit: UiKebabOption
│   └── index.ts            ← re-exports
│
├── web-components/src/utils/
│   └── element-positioner.ts  ← lógica de posicionamiento reutilizable
│
└── angular/src/lib/kebab/
    ├── kebab.component.ts         ← wrapper Angular: UiKebab
    ├── kebab-option.component.ts  ← wrapper Angular: UiKebabOption
    └── index.ts                   ← re-export de UiKebab y UiKebabOption

packages/angular/kebab/
└── ng-package.json   ← secondary entry point para ng-packagr
```

### Qué se exporta desde `@design-lib/angular/kebab`

```ts
import { UiKebab }       from '@design-lib/angular/kebab'; // contenedor
import { UiKebabOption } from '@design-lib/angular/kebab'; // opción
```

Ambos se importan juntos en el array `imports` del componente Angular que los use.
