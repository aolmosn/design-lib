# `ui-radio-button`

Componente de radio button. Permite al usuario seleccionar una única opción dentro de un grupo. Implementado como Web Component con Lit y wrapper Angular con soporte para Reactive Forms.

---

## Índice

1. [Propiedades](#1-propiedades)
2. [Eventos](#2-eventos)
3. [Uso básico en Angular](#3-uso-básico-en-angular)
4. [Reactive Forms](#4-reactive-forms)
5. [Estado deshabilitado](#5-estado-deshabilitado)
6. [Valor preseleccionado](#6-valor-preseleccionado)
7. [Consideraciones del radio group](#7-consideraciones-del-radio-group)
8. [Instalación y paths](#8-instalación-y-paths)

---

## 1. Propiedades

| Propiedad  | Atributo HTML | Tipo      | Default  | Descripción                                                   |
|------------|---------------|-----------|----------|---------------------------------------------------------------|
| `label`    | `label`       | `string`  | `''`     | Texto visible junto al radio button                           |
| `name`     | `name`        | `string`  | `''`     | Nombre del grupo. **Obligatorio** para que el grupo funcione  |
| `value`    | `value`       | `string`  | `'on'`   | Valor que representa esta opción dentro del grupo             |
| `checked`  | `checked`     | `boolean` | `false`  | Estado seleccionado. Reflejado en el atributo del host        |
| `disabled` | `disabled`    | `boolean` | `false`  | Deshabilita la interacción. Reflejado en el atributo del host |
| `required` | `required`    | `boolean` | `false`  | Marca el campo como obligatorio                               |

> `checked`, `disabled` y `required` tienen `reflect: true` — se pueden usar como selectores CSS (`:host([disabled])`).

---

## 2. Eventos

| Evento      | `detail`                             | Cuándo se emite                              |
|-------------|--------------------------------------|----------------------------------------------|
| `ui-change` | `{ checked: boolean, value: string }` | El usuario selecciona esta opción            |
| `ui-blur`   | `{}`                                 | El input nativo pierde el foco               |

Los eventos viajan con `bubbles: true, composed: true`, por lo que atraviesan el shadow DOM y pueden escucharse en el documento.

---

## 3. Uso básico en Angular

### Importar el componente

```ts
import { UiRadioButtonComponent } from '@design-lib/angular/radio-button';

@Component({
  standalone: true,
  imports: [UiRadioButtonComponent],
  template: `...`,
})
export class DemoComponent {}
```

### Template

```html
<ui-radio-button name="fruta" value="manzana" label="Manzana"></ui-radio-button>
<ui-radio-button name="fruta" value="naranja" label="Naranja"></ui-radio-button>
<ui-radio-button name="fruta" value="kiwi"    label="Kiwi"></ui-radio-button>
```

> **Importante:** todos los radio buttons de un mismo grupo deben compartir el mismo valor de `name`. Esto es necesario para que el wrapper Angular gestione la exclusividad (ver [§7](#7-consideraciones-del-radio-group)).

---

## 4. Reactive Forms

### Estructura del formulario

```ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiRadioButtonComponent } from '@design-lib/angular/radio-button';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiRadioButtonComponent],
  templateUrl: './demo.component.html',
})
export class DemoComponent {
  form = new FormGroup({
    videojuegoFavorito: new FormControl(''),
  });
}
```

### Template con `formControlName`

```html
<form [formGroup]="form">
  <ui-radio-button
    formControlName="videojuegoFavorito"
    name="videojuegoFavorito"
    value="Tetris"
    label="Tetris"
  ></ui-radio-button>

  <ui-radio-button
    formControlName="videojuegoFavorito"
    name="videojuegoFavorito"
    value="Puyo Puyo"
    label="Puyo Puyo"
  ></ui-radio-button>
</form>
```

> **Nota:** el atributo `name` y `formControlName` deben tener el mismo valor. `formControlName` conecta al FormGroup, `name` permite al wrapper encontrar los hermanos del grupo para deseleccionarlos.

### Leer el valor del formulario

```ts
// Valor actual
this.form.value.videojuegoFavorito; // → 'Tetris' | 'Puyo Puyo' | ''

// Escuchar cambios
this.form.controls['videojuegoFavorito'].valueChanges.subscribe(value => {
  console.log('seleccionado:', value);
});
```

---

## 5. Estado deshabilitado

El estado `disabled` se puede controlar programáticamente desde el formulario.

### Deshabilitar desde el `FormGroup`

```ts
form = new FormGroup({
  turno: new FormControl({ value: '', disabled: true }), // deshabilitado al inicio
});

// Habilitar dinámicamente
this.form.controls['turno'].enable();

// Deshabilitar dinámicamente
this.form.controls['turno'].disable();
```

### Controlar el disabled con un checkbox

```ts
form = new FormGroup({
  activarTurno: new FormControl(false),
  turno:        new FormControl({ value: '', disabled: true }),
});

ngOnInit(): void {
  this.form.controls['activarTurno'].valueChanges.subscribe(activo => {
    if (activo) {
      this.form.controls['turno'].enable();
    } else {
      this.form.controls['turno'].disable();
    }
  });
}
```

```html
<ui-check-box formControlName="activarTurno">Habilitar selección</ui-check-box>

<ui-radio-button formControlName="turno" name="turno" value="AM" label="AM"></ui-radio-button>
<ui-radio-button formControlName="turno" name="turno" value="PM" label="PM"></ui-radio-button>
```

---

## 6. Valor preseleccionado

Para preseleccionar una opción, se pasa el valor inicial al `FormControl`:

```ts
form = new FormGroup({
  plan: new FormControl('premium'), // "premium" queda seleccionado al cargar
});
```

```html
<ui-radio-button formControlName="plan" name="plan" value="free"    label="Gratis"></ui-radio-button>
<ui-radio-button formControlName="plan" name="plan" value="premium" label="Premium"></ui-radio-button>
<ui-radio-button formControlName="plan" name="plan" value="pro"     label="Pro"></ui-radio-button>
```

---

## 7. Consideraciones del radio group

### El problema del shadow DOM

El browser gestiona la exclusividad de un grupo de radio buttons a través del atributo `name` dentro de un mismo `<form>` o documento. Cuando cada `<ui-radio-button>` tiene su propio shadow DOM, el browser pierde la visibilidad sobre los demás y no puede desactivar automáticamente la opción anterior.

**Síntoma:** se selecciona el segundo radio, pero el primero sigue visualmente seleccionado.

### La solución: `_uncheckSiblings()`

El wrapper Angular resuelve esto manualmente: cuando un radio se activa, busca todos los elementos con el mismo `name` en el documento y les pone `checked = false`.

```ts
private _uncheckSiblings(): void {
  if (!this.name) return;
  document
    .querySelectorAll<HTMLElement & { checked: boolean }>(`ui-radio-button[name="${this.name}"]`)
    .forEach(sibling => {
      if (sibling !== this._el.nativeElement) {
        sibling.checked = false;
      }
    });
}
```

Este método se llama en dos momentos:
- Al recibir el evento `ui-change` (click del usuario)
- En `writeValue` cuando Angular actualiza el valor programáticamente (ej. `form.setValue(...)`)

### Requisito clave

El atributo `name` **debe estar presente en el DOM** en el momento del query. El wrapper lo setea vía `@HostBinding('attr.name')`. Si el `name` no llega al template o no se declara como `@Input()`, el query no encontrará los hermanos.

---

## 8. Instalación y paths

### `tsconfig.json` del proyecto consumidor

Agregar los paths para desarrollo local (antes de build):

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@design-lib/angular/radio-button": [
        "../design-lib/packages/angular/src/lib/radio-button/index.ts"
      ],
      "@design-lib/web-components/radio-button": [
        "../design-lib/packages/web-components/src/components/radio-button/index.ts"
      ]
    }
  }
}
```

### Estructura de archivos del componente

```
packages/
├── web-components/src/components/radio-button/
│   ├── radio-button.ts     ← Lit custom element
│   └── index.ts            ← re-export de UiRadioButton y RadioButtonChangeDetail
│
└── angular/src/lib/radio-button/
    ├── radio-button.component.ts   ← wrapper Angular (ControlValueAccessor)
    └── index.ts                    ← re-export de UiRadioButtonComponent

packages/angular/radio-button/
└── ng-package.json         ← secondary entry point para ng-packagr
```

### Por qué el wrapper importa el web component

```ts
import '@design-lib/web-components/radio-button'; // ← registra customElements.define(...)
```

Sin esta línea, el custom element nunca se registra en el browser y el elemento se renderiza como `HTMLUnknownElement` — sin shadow DOM, sin estilos, sin eventos.
