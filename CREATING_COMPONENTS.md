# Cómo crear un nuevo componente

Guía paso a paso para agregar un componente a la librería. Usa `ui-text-input` como ejemplo concreto en cada etapa.

---

## Índice

1. [Definir el contrato del componente](#1-definir-el-contrato-del-componente)
2. [Agregar tipos al paquete `core`](#2-agregar-tipos-al-paquete-core)
3. [Crear el Web Component con Lit](#3-crear-el-web-component-con-lit)
4. [Registrar el componente en el índice](#4-registrar-el-componente-en-el-índice)
5. [Agregar el demo a la página de desarrollo](#5-agregar-el-demo-a-la-página-de-desarrollo)
6. [Crear el wrapper Angular](#6-crear-el-wrapper-angular)
7. [Checklist final](#7-checklist-final)

---

## 1. Definir el contrato del componente

Antes de escribir una línea de código, definí en papel (o en un comentario) tres cosas:

| Pregunta | Ejemplo: `ui-text-input` |
|---|---|
| ¿Qué propiedades acepta? | `label`, `value`, `placeholder`, `name`, `size`, `disabled`, `readonly`, `required`, `invalid`, `helper-text`, `error-text` |
| ¿Qué eventos emite? | `ui-input`, `ui-change`, `ui-focus`, `ui-blur` |
| ¿Qué estados visuales tiene? | default, focus, invalid, disabled, readonly · tamaños sm/md/lg |

**Reglas de nomenclatura:**
- Elemento: `ui-<nombre>` → `ui-text-input`
- Atributos multi-palabra: kebab-case → `helper-text`, `error-text`
- Eventos: prefijo `ui-` para no colisionar con eventos nativos → `ui-input`, no `input`
- Clase exportada: PascalCase → `UiTextInput`

---

## 2. Agregar tipos al paquete `core`

Si el componente introduce tipos nuevos (estados, variantes, payloads de eventos), van en `packages/core/src/form/types.ts`. Los tipos compartidos evitan duplicación entre el Web Component y el wrapper Angular.

```
packages/core/src/form/types.ts
```

**Ejemplo: tipos que usó `ui-text-input`**

```ts
// Tamaños estándar — aplica a todos los campos
export type ComponentSize = 'sm' | 'md' | 'lg';

// Contrato mínimo de cualquier campo de formulario
export interface FieldProps {
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  helperText?: string;
  errorText?: string;
  size?: ComponentSize;
}

// Payload que viaja en los eventos ui-input y ui-change
export interface FieldChangeDetail<T = string> {
  value: T;
}
```

Luego exportalos desde `packages/core/src/index.ts`:

```ts
export type { ComponentSize, FieldProps, FieldChangeDetail } from './form/types.js';
```

---

## 3. Crear el Web Component con Lit

### 3a. Crear la carpeta del componente

```
packages/web-components/src/components/
└── text-input/           ← nombre en kebab-case
    ├── text-input.ts     ← implementación
    └── index.ts          ← re-export
```

### 3b. Estructura base del archivo `.ts`

Todo componente sigue esta estructura:

```ts
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { generateId } from '@design-lib/core';
import type { ComponentSize, FieldChangeDetail } from '@design-lib/core';

@customElement('ui-text-input')
export class UiTextInput extends LitElement {
  static styles = css`/* ... */`;

  // 1. Propiedades públicas con @property()
  // 2. IDs de accesibilidad generados en la instancia
  // 3. Getters de apoyo (clases CSS, aria-describedby)
  // 4. Método privado _emit() para despachar eventos
  // 5. Manejadores privados (_onInput, _onChange, etc.)
  // 6. render()
}

// Tipado global para autocompletar en HTML
declare global {
  interface HTMLElementTagNameMap {
    'ui-text-input': UiTextInput;
  }
}
```

### 3c. Propiedades con `@property()`

```ts
// Strings simples — Lit observa el atributo automáticamente
@property() label = '';
@property() value = '';
@property() placeholder = '';
@property() name = '';

// Tamaño con tipo explícito
@property() size: ComponentSize = 'md';

// Booleanos: reflect: true hace que el atributo aparezca en el DOM
// cuando la prop es true — útil para selectores CSS :host([disabled])
@property({ type: Boolean, reflect: true }) disabled = false;
@property({ type: Boolean, reflect: true }) readonly = false;
@property({ type: Boolean, reflect: true }) required = false;
@property({ type: Boolean, reflect: true }) invalid = false;

// Atributo con nombre distinto a la propiedad
@property({ attribute: 'helper-text' }) helperText = '';
@property({ attribute: 'error-text' }) errorText = '';
```

**Cuándo usar `reflect: true`:** cuando necesitás aplicar estilos CSS con `:host([disabled])` o cuando el atributo debe estar visible en el DOM para que herramientas externas lo detecten. En los booleanos de estado es la norma.

### 3d. IDs de accesibilidad

Los IDs deben generarse una sola vez por instancia, no en cada render. Por eso van en el cuerpo de la clase, fuera de cualquier método:

```ts
// Se generan al construir la instancia, no en cada render()
private readonly _inputId  = generateId('ui-input');   // → "ui-input-1"
private readonly _helperId = generateId('ui-helper');  // → "ui-helper-2"
private readonly _errorId  = generateId('ui-error');   // → "ui-error-3"
```

`generateId()` vive en `@design-lib/core` y usa un contador global simple. Es suficiente para el browser; si en el futuro se agrega SSR habrá que revisar esta estrategia.

### 3e. Getters de apoyo

Estos getters mantienen el `render()` limpio:

```ts
// Solo mostrar el error cuando el campo es inválido Y hay texto de error
private get _showError(): boolean {
  return this.invalid && Boolean(this.errorText);
}

// aria-describedby apunta solo a los elementos que realmente están en el DOM
private get _describedBy(): string | undefined {
  const ids: string[] = [];
  if (this._showError)                     ids.push(this._errorId);
  if (!this._showError && this.helperText) ids.push(this._helperId);
  return ids.length ? ids.join(' ') : undefined;
}

// Clases CSS dinámicas para classMap()
private get _inputClasses() {
  return {
    input: true,
    'input--sm':      this.size === 'sm',
    'input--lg':      this.size === 'lg',
    'input--invalid': this.invalid,
  };
}
```

### 3f. Emisión de eventos

Un método privado centraliza la creación de eventos. El flag `composed: true` es clave: hace que el evento atraviese el shadow DOM y llegue al documento principal.

```ts
private _emit<T>(name: string, detail: T): void {
  this.dispatchEvent(
    new CustomEvent<T>(name, { detail, bubbles: true, composed: true }),
  );
}

// Manejadores que usan _emit()
private _onInput(e: Event): void {
  const value = (e.target as HTMLInputElement).value;
  this.value = value;
  this._emit<FieldChangeDetail>('ui-input', { value });
}

private _onChange(e: Event): void {
  this._emit<FieldChangeDetail>('ui-change', {
    value: (e.target as HTMLInputElement).value,
  });
}

private _onFocus(): void { this._emit('ui-focus', {}); }
private _onBlur():  void { this._emit('ui-blur', {}); }
```

### 3g. Render con accesibilidad

```ts
render() {
  return html`
    <div class="field" part="field">

      ${this.label ? html`
        <label
          class=${`label${this.required ? ' label--required' : ''}`}
          for=${this._inputId}
          part="label"
        >${this.label}</label>
      ` : nothing}

      <input
        id=${this._inputId}
        class=${classMap(this._inputClasses)}
        part="input"
        type="text"
        name=${ifDefined(this.name || undefined)}
        .value=${this.value}
        placeholder=${ifDefined(this.placeholder || undefined)}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        ?required=${this.required}
        aria-required=${this.required ? 'true' : 'false'}
        aria-invalid=${this.invalid ? 'true' : 'false'}
        aria-describedby=${ifDefined(this._describedBy)}
        @input=${this._onInput}
        @change=${this._onChange}
        @focus=${this._onFocus}
        @blur=${this._onBlur}
      />

      ${this._showError ? html`
        <span id=${this._errorId} class="error" part="error" role="alert">
          ${this.errorText}
        </span>
      ` : nothing}

      ${!this._showError && this.helperText ? html`
        <span id=${this._helperId} class="helper" part="helper">
          ${this.helperText}
        </span>
      ` : nothing}

    </div>
  `;
}
```

**Decisiones de accesibilidad importantes:**

- `for`/`id` entre `<label>` e `<input>`: permite hacer click en el label para enfocar el input.
- `aria-describedby`: conecta el input con el mensaje de error o helper. El mensaje de error tiene prioridad; si está visible el helper no se incluye (para no pisar el anuncio de error).
- `role="alert"` en el error: los lectores de pantalla lo anuncian automáticamente cuando aparece.
- `aria-invalid`: indica a tecnologías asistivas que el valor no es válido.
- `ifDefined(x || undefined)`: evita que Lit renderice el atributo como string vacío cuando no hay valor.
- `.value=${this.value}` (con punto): setea la *propiedad* DOM, no el atributo HTML. Necesario para que Lit actualice el valor live del input correctamente.

### 3h. Estilos con tokens

Los estilos usan CSS custom properties del paquete `tokens`. El valor después de la coma es el fallback si los tokens no están cargados:

```css
.input {
  border: 1px solid var(--ui-color-border, #d1d5db);
  border-radius: var(--ui-radius-md, 6px);
  font-size: var(--ui-font-size-md, 1rem);
  transition: border-color var(--ui-transition-normal, 0.15s ease);
}

/* El foco usa el shadow de token, no un valor fijo */
.input:focus {
  border-color: var(--ui-color-border-focus, #2563eb);
  box-shadow: var(--ui-shadow-focus-primary, 0 0 0 3px rgba(37,99,235,0.2));
}
```

Exponer `::part()` permite al consumidor estilizar desde fuera sin romper la encapsulación del shadow DOM:

```css
/* El componente declara */
<div part="field"> ... </div>
<input part="input" ... />

/* El consumidor puede hacer */
ui-text-input::part(input) {
  border-radius: 0;  /* override para un tema específico */
}
```

### 3i. Crear el archivo `index.ts`

```ts
// packages/web-components/src/components/text-input/index.ts
export { UiTextInput } from './text-input.js';
```

---

## 4. Registrar el componente: barrel e individual entry point

Hay dos lugares donde registrar cada componente nuevo.

### 4a. Barrel (`src/index.ts`) — para quien importa todo

```ts
// packages/web-components/src/index.ts
export { UiTextInput } from './components/text-input/index.js';
// export { UiButton }     from './components/button/index.js';
// export { UiSelect }     from './components/select/index.js';
```

### 4b. Entry point individual — para imports selectivos (tree-shaking)

Agregar el export del componente en `package.json` de `@design-lib/web-components`:

```json
// packages/web-components/package.json
{
  "exports": {
    ".": "./src/index.ts",
    "./text-input": "./src/components/text-input/index.ts",
    "./button":     "./src/components/button/index.ts"
  }
}
```

Con esto, los consumidores pueden importar solo lo que necesitan:

```ts
// Solo registra ui-text-input en el browser, no el resto de la librería
import '@design-lib/web-components/text-input';
```

---

## 5. Agregar el demo a la página de desarrollo

En `packages/web-components/index.html`, agregar una sección por cada estado relevante:

```html
<!-- Siempre mostrar: default, error, disabled, readonly, tamaños -->

<div class="section">
  <p class="section-title">Default</p>
  <ui-text-input
    label="Nombre completo"
    placeholder="Ej. María García"
    helper-text="Tal como aparece en tu documento de identidad"
  ></ui-text-input>
</div>

<div class="section">
  <p class="section-title">Inválido</p>
  <ui-text-input
    label="Email"
    value="no-es-email"
    invalid
    required
    error-text="Ingresá un correo válido"
  ></ui-text-input>
</div>
```

Para verificar los eventos en el browser, agregar un listener manual:

```html
<script type="module">
  import './src/index.ts';

  const el = document.querySelector('ui-text-input');
  el.addEventListener('ui-input', e => console.log('valor:', e.detail.value));
</script>
```

Correr el servidor de desarrollo:

```bash
npm run dev
# o desde la raíz del monorepo:
npm run dev --workspace=packages/web-components
```

---

## 6. Crear el wrapper Angular

El wrapper es un **componente Angular standalone** que:
- Envuelve el Web Component con `CUSTOM_ELEMENTS_SCHEMA`
- Implementa `ControlValueAccessor` para funcionar con `formControlName` y `ngModel`
- Usa `@ViewChild` para setear la propiedad `.value` directamente en el elemento (no como atributo)

### 6a. Crear la carpeta

```
packages/angular/src/lib/
└── text-field/
    ├── text-field.component.ts
    └── index.ts
```

### 6b. El componente

```ts
@Component({
  selector: 'ui-text-field',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ui-text-input
      #inputEl
      [attr.label]="label"
      [attr.disabled]="_isDisabled ? '' : null"
      [attr.invalid]="_showError ? '' : null"
      [attr.error-text]="_showError ? errorText : null"
    ></ui-text-input>
  `,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => UiTextFieldComponent),
    multi: true,
  }],
})
export class UiTextFieldComponent implements ControlValueAccessor, AfterViewInit {
  // ...
}
```

> **Por qué no usar `(ui-input)` en el template:** Los event bindings con hyphens en el nombre (`(ui-input)`, `(ui-blur)`) pueden causar errores en la compilación AOT de Angular. En su lugar, los eventos se suscriben con `addEventListener` en `ngAfterViewInit`.

```ts
ngAfterViewInit(): void {
  const el = this._inputEl.nativeElement;
  el.addEventListener('ui-input', (e: Event) => {
    this._onChange((e as CustomEvent<FieldChangeDetail>).detail.value);
  });
  el.addEventListener('ui-blur', () => this._onTouched());
}
```

**Por qué `[attr.disabled]="_isDisabled ? '' : null"`** y no `[attr.disabled]="_isDisabled"`?
Porque los atributos booleanos en HTML se activan por presencia, no por valor. Un atributo `disabled="false"` sigue deshabilitando el elemento. La forma correcta es: si es `true`, poner el atributo con valor vacío; si es `false`, removerlo con `null`.

**Por qué `@ViewChild` para `writeValue`?**
Lit gestiona el valor del input como *propiedad DOM*, no como atributo HTML. `setAttribute('value', 'foo')` solo mueve el atributo inicial (el "default value"), no el valor en vivo. Por eso usamos `element.value = 'foo'` directamente sobre el elemento nativo.

```ts
writeValue(value: string): void {
  const v = value ?? '';
  if (this._inputEl?.nativeElement) {
    (this._inputEl.nativeElement as { value: string }).value = v;
  } else {
    // La vista no está lista todavía; guardamos para ngAfterViewInit
    this._pendingValue = v;
  }
}

ngAfterViewInit(): void {
  if (this._pendingValue !== null) {
    this._setNativeValue(this._pendingValue);
    this._pendingValue = null;
  }
}
```

### 6c. Registrar: barrel, secondary entry point y paths

**Barrel** (`public-api.ts`) — para re-exports del paquete raíz:

```ts
// packages/angular/src/public-api.ts
export { UiTextFieldComponent } from './lib/text-field/index.js';
```

**Secondary entry point para ng-packagr** — crea el directorio con su `ng-package.json`:

```
packages/angular/
  text-field/
    ng-package.json   ← entry point para ng-packagr
```

```json
// packages/angular/text-field/ng-package.json
{
  "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "../src/lib/text-field/index.ts"
  }
}
```

Agregar el export en `packages/angular/package.json`:

```json
{
  "exports": {
    ".":           { "types": "./dist/types/design-lib-angular.d.ts",            "default": "./dist/fesm2022/design-lib-angular.mjs" },
    "./text-field":{ "types": "./dist/types/design-lib-angular-text-field.d.ts", "default": "./dist/fesm2022/design-lib-angular-text-field.mjs" }
  }
}
```

Después de crear el directorio, **ejecutar el build de la librería**:

```bash
# desde la raíz del monorepo
npm run build:angular
```

**Paths en el proyecto consumidor** (`tsconfig.json`) — para desarrollo con ng serve:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@design-lib/angular/text-field": ["../design-lib/packages/angular/src/lib/text-field/index.ts"],
      "@design-lib/web-components/text-input": ["../design-lib/packages/web-components/src/components/text-input/index.ts"]
    }
  }
}
```

### 6d. Uso en una app Angular

```ts
// Importar por entry point individual
import { UiTextFieldComponent } from '@design-lib/angular/text-field';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [UiTextFieldComponent, ReactiveFormsModule],
  template: `
    <ui-text-field
      formControlName="email"
      label="Correo electrónico"
      placeholder="tu@correo.com"
      required
      [errorText]="emailError"
    ></ui-text-field>
  `,
})
export class LoginFormComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched || ctrl.valid) return '';
    return ctrl.hasError('required') ? 'Campo requerido' : 'Correo inválido';
  }
}
```

---

## 7. Referencia: sintaxis de bindings en templates Lit

Cada prefijo indica *cómo* se conecta el valor al elemento del DOM.

| Sintaxis | Qué hace | Cuándo usarla |
|---|---|---|
| `.prop=${val}` | Setea una **propiedad JS** del objeto DOM | Cuando el valor es no-string (boolean, array, object) o cuando solo existe como propiedad (`indeterminate`, `checked` en vivo) |
| `?attr=${val}` | Agrega/elimina un **atributo booleano** | `?disabled`, `?required`, `?checked` — presente/ausente según `true`/`false` |
| `@evento=${fn}` | Registra un **event listener** | `@change`, `@click`, `@input` — Lit lo limpia automáticamente al destruir |
| `attr=${val}` | Setea un **atributo string** | `name`, `aria-label`, `type` — cualquier valor que funcione como string |
| `${ifDefined(x)}` | Omite el atributo si el valor es `undefined` | Evita renderizar `name=""` cuando no hay valor |

```ts
// Ejemplos en un template Lit
html`
  <input
    type="checkbox"               <!-- atributo string fijo -->
    name=${ifDefined(this.name || undefined)}  <!-- atributo string, omitido si vacío -->
    .value=${this.value}          <!-- propiedad JS (no el atributo initial value) -->
    .checked=${this.checked}      <!-- propiedad JS booleana -->
    .indeterminate=${this.indeterminado} <!-- SOLO existe como propiedad, no como atributo -->
    ?disabled=${this.disabled}    <!-- atributo booleano (presente/ausente) -->
    ?required=${this.required}
    aria-checked=${'mixed'}       <!-- atributo string con valor calculado -->
    @change=${this._onNativeChange} <!-- event listener -->
    @blur=${this._onNativeBlur}
  />
`
```

**La diferencia clave entre `.checked` y `?checked`:**
- `.checked=${true}` → `input.checked = true` (propiedad JS, refleja el estado live)
- `?checked=${true}` → `<input checked>` (atributo HTML, solo define el valor inicial)

Para formularios siempre usar `.checked`, `.value`, `.indeterminate` (propiedades), no los atributos.

---

## 8. Patrón de wrapper Angular: `@HostBinding`

El documento ya describe el patrón con template interno (`<ui-text-input #inputEl ...>`). Para componentes de formulario simples (checkbox, radio, select) existe un patrón más directo donde el **selector del componente Angular es el mismo tag del custom element**.

### Cuándo usar cada patrón

| Patrón | Usar cuando |
|---|---|
| **Template interno** (`<ui-text-input #inputEl>`) | El wrapper agrega lógica visual propia (mensajes de error, label, slots adicionales) |
| **`@HostBinding`** (`selector: 'ui-check-box'`) | El wrapper es solo un bridge de formulario, la UI es 100% del custom element |

### 8a. Estructura del wrapper con `@HostBinding`

```ts
import {
  AfterViewInit, ChangeDetectorRef, Component,
  ElementRef, HostBinding, Input, NgZone, forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { CheckBoxChangeDetail } from '@design-lib/web-components/check-box';
import '@design-lib/web-components/check-box'; // ← registra el custom element

@Component({
  selector: 'ui-check-box',           // ← mismo tag que el Lit custom element
  standalone: true,
  template: `<ng-content></ng-content>`, // ← sin template propio; Lit maneja el shadow DOM
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => UiCheckBoxComponent),
    multi: true,
  }],
})
export class UiCheckBoxComponent implements ControlValueAccessor, AfterViewInit {
  constructor(
    private _el: ElementRef,
    private _zone: NgZone,
    private _cdr: ChangeDetectorRef,
  ) {}

  @Input() label    = '';
  @Input() name     = '';
  @Input() required = false;
  private _isDisabled = false;

  // @HostBinding escribe atributos en el host element (el mismo <ui-check-box>)
  // Lit los lee vía attributeChangedCallback y actualiza sus @property()
  @HostBinding('attr.label')    get _attrLabel()    { return this.label    || null; }
  @HostBinding('attr.name')     get _attrName()     { return this.name     || null; }
  @HostBinding('attr.required') get _attrRequired() { return this.required ? '' : null; }
  // disabled NO usa @HostBinding — ver sección 8c

  private _onChange: (value: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    const el = this._el.nativeElement;

    el.addEventListener('ui-change', (e: Event) => {
      this._zone.run(() => {                   // ← ver sección 8b
        this._onChange((e as CustomEvent<CheckBoxChangeDetail>).detail.checked);
        this._cdr.markForCheck();
      });
    });

    el.addEventListener('ui-blur', () => {
      this._zone.run(() => {
        this._onTouched();
        this._cdr.markForCheck();
      });
    });
  }

  writeValue(value: boolean): void {
    this._el.nativeElement.checked = !!value;  // setea propiedad Lit directamente
  }

  registerOnChange(fn: (value: boolean) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this._isDisabled = isDisabled;
    // Manipular el atributo directamente — ver sección 8c
    if (isDisabled) {
      this._el.nativeElement.setAttribute('disabled', '');
    } else {
      this._el.nativeElement.removeAttribute('disabled');
    }
    this._cdr.markForCheck();
  }
}
```

**Por qué `import '@design-lib/web-components/check-box'`:** Sin esta línea, `customElements.define('ui-check-box', ...)` nunca se ejecuta. El browser renderiza el elemento como `HTMLUnknownElement` (sin shadow DOM, sin estilos). Este import es obligatorio en el wrapper, aunque el consumer final no lo vea.

### 8b. NgZone + ChangeDetectorRef: eventos fuera de Zone

Lit usa el interface `handleEvent` internamente para sus event bindings (`@change=${handler}`). Zone.js no parchea siempre el `handleEvent` object interface correctamente — los eventos custom que vienen desde shadow DOM pueden ejecutar fuera de la Angular Zone. Resultado: el form control se actualiza pero Angular no ejecuta change detection y el DOM no refleja el cambio hasta el próximo evento que sí esté dentro de Zone.

**Síntoma:** el input actualiza el valor en el FormControl, pero la vista (un interpolation `{{ form.value }}` o similar) solo se actualiza al hacer blur, no al escribir.

**Solución robusta: `zone.run()` + `markForCheck()`**

```ts
el.addEventListener('ui-change', (e: Event) => {
  this._zone.run(() => {
    // zone.run() cubre Angular con Zone.js estándar
    this._onChange(detail.value);
    // markForCheck() cubre OnPush y el futuro modo Zoneless
    this._cdr.markForCheck();
  });
});
```

`zone.run()` solo no es suficiente en componentes con `ChangeDetectionStrategy.OnPush`. `markForCheck()` solo no es suficiente en componentes sin `OnPush`. Usar ambos es la solución que funciona en todos los casos.

### 8c. `setDisabledState`: manipular el atributo directamente

**No usar `@HostBinding` para `disabled`** en el wrapper de ControlValueAccessor. El problema: `@HostBinding` solo aplica el atributo durante un ciclo de change detection. `setDisabledState` puede ser llamado por Angular en un momento donde no hay un CD cycle activo o pendiente, y el atributo llega tarde (o nunca) al Lit element.

```ts
// ❌ Frágil: depende del timing del CD cycle
@HostBinding('attr.disabled') get _attrDisabled() { return this._isDisabled ? '' : null; }

setDisabledState(isDisabled: boolean): void {
  this._isDisabled = isDisabled; // @HostBinding se actualizará... ¿cuándo?
}

// ✅ Correcto: manipulación directa + markForCheck()
setDisabledState(isDisabled: boolean): void {
  this._isDisabled = isDisabled;
  if (isDisabled) {
    this._el.nativeElement.setAttribute('disabled', '');
  } else {
    this._el.nativeElement.removeAttribute('disabled');
  }
  this._cdr.markForCheck();
}
```

`setAttribute`/`removeAttribute` sobre un Lit custom element dispara `attributeChangedCallback` sincrónicamente, y Lit actualiza su `@property()` y agenda un re-render de inmediato.

### 8d. `@ViewChild` con `{ read: ElementRef }`

Cuando el selector de un componente Angular coincide con un tag de custom element, `@ViewChild('ref')` por defecto devuelve la **instancia del componente Angular**, no el elemento DOM.

```ts
// En el template:
// <ui-alert #myAlert ...></ui-alert>

// ❌ Devuelve UiAlertComponent (instancia Angular) — no tiene .icons ni .checked
@ViewChild('myAlert') uiAlert!: UiAlertComponent;

// ✅ Devuelve el HTMLElement del Lit custom element
@ViewChild('myAlert', { read: ElementRef }) uiAlert!: ElementRef;

ngAfterViewInit(): void {
  this.uiAlert.nativeElement.icons = { INFO: 'star' }; // propiedad Lit, no atributo
}
```

La regla: si necesitás setear una **propiedad JS** en el elemento (no un atributo), siempre usar `{ read: ElementRef }`.

---

## 9. Patrón de radio group

Los radio buttons presentan un desafío específico: la exclusividad de grupo (seleccionar uno deselecciona los demás) la maneja el browser vía el atributo `name` en el mismo form o documento. Cuando cada radio button está en su propio shadow DOM, el browser pierde esa visibilidad y no puede hacer el "uncheck" automático.

### La solución: deseleccionar hermanos explícitamente

El wrapper Angular debe hacer lo que el browser no puede: cuando un radio se selecciona, buscar y deseleccionar todos los demás con el mismo `name`.

```ts
// En el event listener
el.addEventListener('ui-change', (e: Event) => {
  this._zone.run(() => {
    this._uncheckSiblings();  // ← primero, antes de notificar a Angular
    this._onChange((e as CustomEvent<RadioButtonChangeDetail>).detail.value);
    this._cdr.markForCheck();
  });
});

// En writeValue (para updates programáticos: form.setValue(...))
writeValue(formValue: string): void {
  const isSelected = (formValue === this.value);
  this._el.nativeElement.checked = isSelected;
  if (isSelected) {
    this._uncheckSiblings();
  }
}

// Busca por atributo name en el documento
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

**Por qué `writeValue` también llama a `_uncheckSiblings`:** Angular no garantiza que llame `writeValue` en todos los ControlValueAccessors del mismo `formControlName` cuando el valor cambia programáticamente. Hacer el uncheck desde el elemento que se activa cubre ese caso.

**Requisito:** el atributo `name` debe estar presente en el DOM cuando se ejecuta el query. Asegurar que `@HostBinding('attr.name')` lo setea, y que el template pasa `name="grupo"` como input al wrapper.

---

## 10. Checklist final

Antes de considerar el componente listo, verificar:

### Accesibilidad
- [ ] `<label>` vinculado al input con `for`/`id`
- [ ] `aria-invalid` presente y correcto
- [ ] `aria-describedby` apunta al elemento de error o helper (no a ambos a la vez)
- [ ] El mensaje de error tiene `role="alert"`
- [ ] Estado indeterminado usa `aria-checked="mixed"` (si aplica)
- [ ] Navegable por teclado (si aplica: flechas, Enter, Escape)
- [ ] Estados visibles con `:focus-visible`, no solo `:focus`
- [ ] No anidar `<label>` dentro de `<label>` — usar `<span>` para el texto del label interno

### API del Web Component (Lit)
- [ ] Todas las props booleanas tienen `reflect: true`
- [ ] Los eventos usan el prefijo `ui-` y viajan con `composed: true`
- [ ] Los eventos custom incluyen `detail` con los datos relevantes (`checked`, `value`, etc.)
- [ ] Los atributos multi-palabra usan kebab-case (`helper-text`, no `helperText`)
- [ ] El `declare global { HTMLElementTagNameMap }` está al final del archivo
- [ ] Las propiedades que solo existen como JS (como `indeterminate`) se bindean con `.prop=` en el template Lit, no con `?attr=`
- [ ] El `index.ts` exporta la clase y los tipos de eventos (`export type { MiChangeDetail }`)

### Wrapper Angular
- [ ] El wrapper importa el custom element (`import '@design-lib/web-components/mi-componente'`)
- [ ] Los eventos se suscriben con `addEventListener` en `ngAfterViewInit`, no con `(ui-evento)` en el template (falla en AOT)
- [ ] Los callbacks de eventos están envueltos en `this._zone.run(() => { ...; this._cdr.markForCheck(); })`
- [ ] `setDisabledState` manipula el atributo directamente (`setAttribute`/`removeAttribute`) — no delega a `@HostBinding`
- [ ] Si hay radio buttons: `_uncheckSiblings()` se llama al seleccionar (en el evento y en `writeValue`)
- [ ] Si se necesita acceso al DOM nativo desde un template Angular: `@ViewChild('ref', { read: ElementRef })`

### Estilos
- [ ] Todos los valores visuales usan tokens (`var(--ui-*)`) con fallback
- [ ] Los elementos interactivos exponen `::part()` para override externo
- [ ] Los tres tamaños (sm, md, lg) están implementados si aplica

### Integración
- [ ] Exportado desde `packages/web-components/src/index.ts` (barrel)
- [ ] Entry point individual en `packages/web-components/package.json` exports (`"./nombre-componente"`)
- [ ] Wrapper Angular creado y exportado desde `packages/angular/src/public-api.ts` (barrel)
- [ ] Secondary entry point de ng-packagr creado en `packages/angular/nombre-componente/ng-package.json`
- [ ] Export del secondary entry point declarado en `packages/angular/package.json`
- [ ] `npm run build:angular` ejecutado después de los cambios anteriores
- [ ] Paths individuales agregados en `tsconfig.json` del proyecto consumidor (tanto `@design-lib/angular/...` como `@design-lib/web-components/...`)
- [ ] Demo agregado en `packages/web-components/index.html` con al menos: default, error, disabled
