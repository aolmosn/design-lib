# Compatibilidad de versiones de Angular en @design-lib/angular

Este documento explica cómo funciona la compatibilidad de versiones entre `@design-lib/angular` y los proyectos que la consumen, qué garantiza el sistema de compilación de Angular y dónde están los límites.

---

## 1. Cómo funciona la compilación parcial (ng-packagr)

Cuando se ejecuta el build de la design-lib con ng-packagr, el compilador **no genera el componente final**. En lugar de eso, genera una descripción en formato `ɵɵngDeclareComponent` — solo metadatos, sin código de renderizado.

```typescript
// Lo que tú escribes
@Component({
  selector: 'ui-text-field',
  standalone: true,
  template: `<ui-text-input [label]="label" />`,
})
export class UiTextFieldComponent {
  @Input() label = '';
}
```

```javascript
// Lo que ng-packagr produce en el dist (.mjs)
UiTextFieldComponent.ɵcmp = ɵɵngDeclareComponent({
  version: '22.0.0',        // versión con la que se compiló
  type: UiTextFieldComponent,
  selector: 'ui-text-field',
  inputs: { label: 'label' },
  template: `<ui-text-input [label]="label" />`,
  // sin código de renderizado — solo la descripción
});
```

El `ɵɵngDeclareComponent` es el formato de **compilación parcial**: el componente está a medias, listo para ser completado por el proyecto consumidor.

---

## 2. El Angular Linker: quién completa el componente

Cuando un microfrontend hace `npm run build`, `@ngtools/webpack` detecta el `ɵɵngDeclareComponent` en el dist de la librería y activa el **Angular Linker**. Este lee los metadatos y genera el código de renderizado real usando las funciones de Angular **de la versión del MFE**:

```javascript
// Lo que el Linker genera en el build del MFE (nunca está en disco)
UiTextFieldComponent.ɵcmp = ɵɵdefineComponent({
  type: UiTextFieldComponent,
  selectors: [['ui-text-field']],
  inputs: { label: [0, 'label', 'label'] },
  decls: 1,
  vars: 1,
  template: function UiTextFieldComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵelement(0, 'ui-text-input');     // ← funciones de Angular 22 del MFE
    }
    if (rf & 2) {
      ɵɵproperty('label', ctx.label);    // ← funciones de Angular 22 del MFE
    }
  },
});
```

Las funciones `ɵɵdefineComponent`, `ɵɵelement`, `ɵɵproperty` que usa el componente en runtime son siempre las de la versión Angular del MFE, no las de la design-lib. La design-lib nunca pone código de renderizado en el dist.

---

## 3. Compatibilidad hacia adelante: design-lib antigua, MFE nuevo

Este es el escenario más común y el que mejor funciona:

```
Design-lib compilada con Angular 22
        ↓
  ɵɵngDeclareComponent({ version: '22.0.0', ... })
        ↓
MFE con Angular 23  →  Linker de Angular 23 lee el formato v22  ✓
                    →  genera código con funciones de Angular 23 ✓
                    →  bundle final 100% Angular 23              ✓
```

Angular garantiza que el Linker de versiones nuevas siempre sabe leer formatos de versiones anteriores. Esto significa que **si un MFE actualiza Angular, no es necesario recompilar ni redesplegar la design-lib**.

---

## 4. Compatibilidad hacia atrás: design-lib nueva, MFE antiguo

Este caso no funciona:

```
Design-lib compilada con Angular 25
        ↓
  ɵɵngDeclareComponent({ version: '25.0.0', ... })
        ↓
MFE con Angular 19  →  Linker de Angular 19 no conoce el formato v25  ✗
                    →  error en build o crash en runtime                ✗
```

El Linker de Angular 19 no puede procesar un formato que fue definido en Angular 25 porque ese formato no existía cuando Angular 19 fue publicado.

**La regla:**

```
Versión design-lib  ≤  Versión MFE   →  funciona
Versión design-lib  >  Versión MFE   →  puede fallar
```

---

## 5. El límite real: las APIs que usa la librería

La versión del compilador no es el único factor — lo que determina la compatibilidad real es **qué APIs de Angular se usan dentro de la librería**. El Linker podría procesar el formato correctamente, pero si genera código que llama a una función que no existe en la versión del MFE, el bundle falla en runtime.

Ejemplo con Signals:

```typescript
// Design-lib compilada con Angular 22 usando Signals
@Component({
  template: `{{ count() }}`,
})
export class UiCounterComponent {
  count = signal(0);   // ← API de Angular 16+
}
```

```
MFE con Angular 22  →  signal() existe → funciona      ✓
MFE con Angular 14  →  signal() no existe → crash      ✗
                        (ɵɵreadSignal is not a function)
```

### Tabla de versión mínima por feature

| Feature usado en la design-lib | Versión mínima del MFE |
|---|---|
| `@Input()`, `@Output()`, templates básicos | Angular 2+ |
| `standalone: true` | Angular 14+ |
| `inject()` (function-based injection) | Angular 14+ |
| `signal()`, `computed()`, `effect()` | Angular 16+ |
| `input()`, `output()` (signal-based) | Angular 17+ |
| `@let` en templates | Angular 18+ |
| `linkedSignal()` | Angular 19+ |

La versión mínima soportada la dictan las APIs más modernas que se usen en la librería, no la versión con la que se compiló.

---

## 6. El riesgo de las APIs deprecadas

Las APIs deprecadas son el caso más silencioso — no fallan de inmediato sino que degradan comportamiento con el tiempo.

### Ciclo de vida de una API deprecada

Angular sigue un proceso antes de eliminar cualquier API:

```
Angular 15  →  introduce la API nueva, marca la vieja como @deprecated
Angular 16  →  sigue funcionando, warnings en consola
Angular 17  →  sigue funcionando
Angular 18  →  la elimina definitivamente
```

Angular suele dar **2 majors de margen** antes de eliminar una API deprecada.

### Cómo afecta a la design-lib

Si la design-lib usa una API deprecada y los MFEs consumidores actualizan Angular:

```
Design-lib usa NgModule (deprecado en Angular 17)

MFE con Angular 16  →  funciona, sin warnings            ✓
MFE con Angular 17  →  funciona, warning en build        ⚠️
MFE con Angular 19  →  NgModule eliminado → crash        ✗
```

### El caso más peligroso: degradación silenciosa

Algunas APIs deprecadas no fallan — simplemente se comportan de forma diferente en versiones nuevas:

```typescript
// Design-lib usa ChangeDetectorRef.markForCheck() — approach antiguo
// Angular 18+ con zoneless: el componente "funciona" pero no se actualiza
// cuando debería. Sin error en consola, solo un bug difícil de rastrear.
```

---

## 7. Cómo proteger la compatibilidad

### Declarar el rango soportado con peerDependencies

```json
// design-lib/packages/angular/package.json
{
  "peerDependencies": {
    "@angular/core": ">=16.0.0 <24.0.0"
  }
}
```

`peerDependencies` le dice al consumidor qué versión de Angular necesita sin instalarla — npm y yarn muestran una advertencia si la versión instalada queda fuera del rango.

### Activar strict mode en el compilador

```json
// design-lib/tsconfig.json
{
  "compilerOptions": {
    "strict": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true
  }
}
```

Esto hace que el compilador de Angular detecte el uso de APIs deprecadas o patrones que cambiarán de comportamiento en versiones futuras.

### Testear contra el rango de versiones soportadas

```bash
# Verificar que la librería funciona con Angular 16
npm install @angular/core@16 @angular/compiler@16
npm run build

# Verificar con Angular 22
npm install @angular/core@22 @angular/compiler@22
npm run build
```

---

## 8. Resumen de riesgos en ambas direcciones

```
Design-lib muy antigua  →  MFE muy nuevo
  APIs deprecadas eliminadas  →  crash en build o runtime
  Comportamiento silencioso   →  bug difícil de rastrear
  Detección: warnings en el build del MFE

Design-lib muy nueva  →  MFE muy antiguo
  APIs que no existen en el MFE  →  crash inmediato en runtime
  El Linker no reconoce el formato parcial nuevo
  Detección: falla rápido, fácil de identificar
```

El segundo escenario falla de inmediato y es fácil de detectar. El primero es el traicionero: puede pasar meses antes de que alguien note que un componente no se actualiza correctamente o se comporta de forma inesperada.

---

## 9. Recomendación para este proyecto

`@design-lib/angular` actualmente usa `standalone: true` y `@Input()` / `ControlValueAccessor` — APIs estables disponibles desde Angular 14. El rango seguro sin cambios es:

```json
"peerDependencies": {
  "@angular/core": ">=14.0.0"
}
```

Si en el futuro se adoptan Signals para los inputs del componente (`input()` signal-based), el rango mínimo subiría a Angular 17:

```json
"peerDependencies": {
  "@angular/core": ">=17.0.0"
}
```

Cada vez que se adopta una API nueva de Angular dentro de la librería, hay que evaluar si vale la pena subir el mínimo requerido o mantener compatibilidad con versiones anteriores.
