import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { generateId } from '@design-lib/core';
import type { ComponentSize, FieldChangeDetail } from '@design-lib/core';
import { inputBaseStyles } from '../../styles/input-base.styles';
import { defaultFontFamily } from '../../styles/default-font.styles';

/**
 * Campo de texto base. Soporta label, helper text, error text, tamaños,
 * estados (disabled, readonly, required, invalid) y emite eventos prefijados
 * con `ui-` para no colisionar con eventos nativos del DOM.
 *
 * @fires {CustomEvent<FieldChangeDetail>} ui-input  - Al escribir
 * @fires {CustomEvent<FieldChangeDetail>} ui-change - Al confirmar valor (blur/Enter)
 * @fires {CustomEvent}                    ui-focus  - Al recibir foco
 * @fires {CustomEvent}                    ui-blur   - Al perder foco
 *
 * @csspart field  - Contenedor raíz (.input-wrap)
 * @csspart label  - Elemento <label>
 * @csspart input  - Elemento <input> nativo
 * @csspart helper - Texto de ayuda
 * @csspart error  - Mensaje de error
 */
@customElement('ui-text-input')
export class UiTextInput extends LitElement {
  static override styles = [
    defaultFontFamily,
    inputBaseStyles,
    css`
      :host { display: block; }

      /* ── Input nativo (sin borde, sin outline propio) ── */
      .native-input {
        flex: 1;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        font-family: inherit;
        font-size: var(--wk-font-size-b1, 0.875rem);
        color: var(--wk-color-on-surface, #37474f);
        line-height: 1.4;
        padding: 0;
      }

      .native-input::placeholder {
        color: var(--wk-color-on-surface-muted, #546e7a);
      }

      .input-field--disabled .native-input { cursor: not-allowed; }
      .input-field--readonly .native-input { cursor: default; }

      /* ── Tamaños ────────────────────────────────────── */
      .input-field--sm {
        height: 32px;
        padding: 0 var(--wk-space-2, 8px);
      }
      .input-field--sm .native-input {
        font-size: var(--wk-font-size-b3, 0.8125rem);
      }

      .input-field--lg {
        height: 48px;
        padding: 0 var(--wk-space-4, 16px);
      }
      .input-field--lg .native-input {
        font-size: var(--wk-font-size-md, 1rem);
      }

      /* ── Asterisco requerido ────────────────────────── */
      .input-label--required::after {
        content: ' *';
        color: var(--wk-color-danger, #ed0c10);
      }
    `
  ];

  // ── Propiedades públicas ─────────────────────────────────────────
  @property() label = '';
  @property() value = '';
  @property() placeholder = '';
  @property() name = '';
  /** Tipo del input nativo: text | email | password | number | search | url | tel */
  @property() type = 'text';
  @property() size: ComponentSize = 'md';
  @property({ type: Boolean, reflect: true }) disabled  = false;
  @property({ type: Boolean, reflect: true }) readonly  = false;
  @property({ type: Boolean, reflect: true }) required  = false;
  @property({ type: Boolean, reflect: true }) invalid   = false;
  @property({ attribute: 'helper-text' }) helperText = '';
  @property({ attribute: 'error-text' })  errorText  = '';

  // ── IDs para accesibilidad ───────────────────────────────────────
  private readonly _inputId  = generateId('ui-input');
  private readonly _helperId = generateId('ui-helper');
  private readonly _errorId  = generateId('ui-error');

  // ── Getters ──────────────────────────────────────────────────────
  private get _showError(): boolean {
    return this.invalid && Boolean(this.errorText);
  }

  private get _describedBy(): string | undefined {
    const ids: string[] = [];
    if (this._showError)                     ids.push(this._errorId);
    if (!this._showError && this.helperText) ids.push(this._helperId);
    return ids.length ? ids.join(' ') : undefined;
  }

  // ── Eventos ──────────────────────────────────────────────────────
  private _emit<T>(name: string, detail: T): void {
    this.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: true, composed: true }));
  }

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

  // ── Render ───────────────────────────────────────────────────────
  override render() {
    return html`
      <div class="input-wrap" part="field">

        ${this.label ? html`
          <label
            class=${`input-label${this.required ? ' input-label--required' : ''}`}
            for=${this._inputId}
            part="label"
          >${this.label}</label>
        ` : nothing}

        <div class=${classMap({
          'input-field':           true,
          'input-field--sm':       this.size === 'sm',
          'input-field--lg':       this.size === 'lg',
          'input-field--error':    this.invalid,
          'input-field--disabled': this.disabled,
          'input-field--readonly': this.readonly,
        })}>
          <input
            id=${this._inputId}
            class="native-input"
            part="input"
            type=${this.type}
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
            @focus=${() => this._emit('ui-focus', {})}
            @blur=${() => this._emit('ui-blur', {})}
          />
        </div>

        ${this._showError ? html`
          <span id=${this._errorId} class="input-error-msg" part="error" role="alert">
            ${this.errorText}
          </span>
        ` : nothing}

        ${!this._showError && this.helperText ? html`
          <span id=${this._helperId} class="input-helper" part="helper">
            ${this.helperText}
          </span>
        ` : nothing}

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-text-input': UiTextInput;
  }
}
