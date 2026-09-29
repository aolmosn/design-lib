# Tokens semánticos — Guía de uso

Los tokens se dividen en dos capas:

- **Primitivos** (`--wk-green-500`, `--wk-gray-200`, etc.): valores fijos del sistema de color. Son la paleta base. No se usan directamente en los componentes.
- **Semánticos** (`--wk-color-surface`, `--wk-color-on-surface`, etc.): describen el **rol** del color, no el color en sí. Son los que cambian entre light y dark. Los componentes solo usan estos.

---

## ¿Por qué semánticos?

Si un componente usa `--wk-white` como fondo y `--wk-gray-500` como texto, para hacer dark mode tenés que cambiar cada componente. Si en cambio usa `--wk-color-surface` y `--wk-color-on-surface`, solo cambiás los tokens semánticos una vez en `tokens.css` y todos los componentes responden solos.

---

## Categorías

### 1. Surface — Superficies y fondos

Describen el fondo de un contenedor. La jerarquía va de la página (más neutra) a los elementos encima (más contrastados).

| Token | Light | Dark | Se usa en |
|---|---|---|---|
| `--wk-color-surface` | `#ffffff` | `#1e1e2e` | Fondo de cards, modales, inputs, popovers |
| `--wk-color-surface-alt` | `--wk-gray-50` | `#16161e` | Fondo de la página, sidebars, headers, secciones alternas |
| `--wk-color-surface-raised` | `#ffffff` + sombra | `#26263a` | Elementos que "flotan": dropdowns, tooltips, coachmarks |
| `--wk-color-surface-overlay` | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.7)` | Backdrop de modales, onboarding spotlight |

**Ejemplo de uso:**
```css
/* Card */
.card {
  background: var(--wk-color-surface);
}

/* Página */
body {
  background: var(--wk-color-surface-alt);
}

/* Dropdown / Coachmark */
.popover {
  background: var(--wk-color-surface-raised);
}
```

---

### 2. On-surface — Texto y contenido sobre superficies

Describen el color del contenido que va **encima** de una surface. El sufijo indica el nivel de jerarquía visual.

| Token | Light | Dark | Se usa en |
|---|---|---|---|
| `--wk-color-on-surface` | `--wk-gray-500` | `--wk-gray-100` | Texto principal, íconos primarios |
| `--wk-color-on-surface-muted` | `--wk-gray-400` | `--wk-gray-300` | Texto secundario, labels, placeholders, descripciones |
| `--wk-color-on-surface-disabled` | `--wk-gray-300` | `--wk-gray-400` | Texto de elementos desactivados |

**Regla:** el sufijo del token de texto debe coincidir con la superficie sobre la que está.  
Texto encima de `--wk-color-surface` → usar `--wk-color-on-surface`.

**Ejemplo:**
```css
.label {
  color: var(--wk-color-on-surface-muted); /* texto secundario */
}

.value {
  color: var(--wk-color-on-surface); /* texto principal */
}

.hint {
  color: var(--wk-color-on-surface-disabled); /* texto desactivado */
}
```

---

### 3. Border — Bordes y divisores

| Token | Light | Dark | Se usa en |
|---|---|---|---|
| `--wk-color-border` | `--wk-gray-200` | `--wk-gray-400` | Borde de cards, inputs en reposo, separadores |
| `--wk-color-border-strong` | `--wk-gray-400` | `--wk-gray-200` | Borde con mayor contraste, inputs con foco |
| `--wk-color-border-error` | `--wk-red-500` | `--wk-red-400` | Borde de inputs en estado de error |

**Ejemplo:**
```css
.input {
  border: 1px solid var(--wk-color-border);
}

.input:focus {
  border-color: var(--wk-color-border-strong);
}

.input.error {
  border-color: var(--wk-color-border-error);
}
```

---

### 4. Interactive — Estados de interacción

Cada color corporativo cumple un rol semántico específico. Los primitivos no cambian entre temas; lo que varía es qué tono se usa según el estado.

#### Verde — Acción principal

El verde es el color de confirmación y avance. Se usa en todo lo que el usuario puede hacer para progresar.

| Token | Primitivo | Se usa en |
|---|---|---|
| `--wk-color-action` | `--wk-green-500` | Botón primary, checkbox activo, switch on |
| `--wk-color-action-hover` | `--wk-green-400` | Estado hover del botón primary |
| `--wk-color-action-active` | `--wk-green-300` | Estado pressed |
| `--wk-color-action-subtle` | `--wk-green-100` | Fondo de chip activo, fondo de row seleccionada |
| `--wk-color-action-on` | `--wk-white` | Texto/ícono encima de fondo verde |

```css
.btn-primary {
  background: var(--wk-color-action);
  color: var(--wk-color-action-on);
  border-color: var(--wk-color-action);
}
.btn-primary:hover { background: var(--wk-color-action-hover); }
.btn-primary:active { background: var(--wk-color-action-active); }

.row-selected { background: var(--wk-color-action-subtle); }
```

#### Azul — Navegación e información

El azul indica referencia, navegación y contexto informativo. También es el color de foco para accesibilidad.

| Token | Primitivo | Se usa en |
|---|---|---|
| `--wk-color-info` | `--wk-blue-500` | Links, botón link, badges informativos |
| `--wk-color-info-hover` | `--wk-blue-400` | Hover de links |
| `--wk-color-info-subtle` | `--wk-blue-100` | Fondo de alerts informativos |
| `--wk-color-focus` | `--wk-blue-500` | Anillo de foco de inputs (accesibilidad) |

```css
a { color: var(--wk-color-info); }
a:hover { color: var(--wk-color-info-hover); }

.alert-info {
  background: var(--wk-color-info-subtle);
  border-left: 3px solid var(--wk-color-info);
}

input:focus-visible {
  outline: 2px solid var(--wk-color-focus);
}
```

#### Rojo — Destructivo y error

El rojo indica peligro, eliminación o un estado inválido que requiere corrección.

| Token | Primitivo | Se usa en |
|---|---|---|
| `--wk-color-danger` | `--wk-red-500` | Botón eliminar, borde de input inválido |
| `--wk-color-danger-hover` | `--wk-red-400` | Hover del botón danger |
| `--wk-color-danger-subtle` | `--wk-red-100` | Fondo de alerts de error, fila con error |
| `--wk-color-error` | `--wk-red-500` | Mensaje de validación, ícono de error |

```css
.btn-danger {
  background: var(--wk-color-danger);
  color: var(--wk-color-action-on); /* blanco */
}
.btn-danger:hover { background: var(--wk-color-danger-hover); }

.input.invalid { border-color: var(--wk-color-error); }

.alert-error {
  background: var(--wk-color-danger-subtle);
  border-left: 3px solid var(--wk-color-error);
  color: var(--wk-color-error);
}
```

#### Amarillo — Advertencia

El amarillo atrae atención sin bloquear. Se usa para advertencias no críticas. Nota: el amarillo no tiene contraste suficiente para texto blanco, se usa `--wk-gray-500`.

| Token | Primitivo | Se usa en |
|---|---|---|
| `--wk-color-warning` | `--wk-yellow-500` | Badge de advertencia, ícono de alerta |
| `--wk-color-warning-subtle` | `--wk-yellow-100` | Fondo de alert de warning |
| `--wk-color-warning-on` | `--wk-gray-500` | Texto encima de fondo amarillo |

```css
.badge-warning {
  background: var(--wk-color-warning);
  color: var(--wk-color-warning-on); /* gris oscuro, no blanco */
}

.alert-warning {
  background: var(--wk-color-warning-subtle);
  border-left: 3px solid var(--wk-color-warning);
  color: var(--wk-color-warning-on);
}
```

---

## Resumen visual — jerarquía de superficie

```
┌─────────────────────────────────────────────────────────────┐
│  body / página          → --wk-color-surface-alt            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  card / modal         → --wk-color-surface           │   │
│  │                                                      │   │
│  │  Título               → --wk-color-on-surface        │   │
│  │  Subtítulo            → --wk-color-on-surface-muted  |   │
│  │  Borde de input       → --wk-color-border            │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  dropdown / tooltip  → --wk-color-surface-raised| |   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  backdrop modal          → --wk-color-surface-overlay       │
└─────────────────────────────────────────────────────────────┘
```

---

## Reglas de oro

1. **Nunca usar primitivos en componentes** — siempre ir por el semántico. Si no existe el semántico que necesitás, crealo.
2. **El texto siempre referencia la superficie sobre la que está** — texto sobre `surface` → `on-surface`, texto sobre color primario → `primary-on`.
3. **Los colores de acento (verde, azul) raramente cambian en dark** — lo que cambia son las superficies y el texto.
4. **Los tokens `subtle` son para fondos de estados** — chip activo, alert, badge. Nunca para texto porque no tienen contraste suficiente.
5. **No definir dark en el componente** — dark mode se define solo en `tokens.css`. El componente usa `var()` y hereda el cambio automáticamente, incluso a través del shadow DOM.
