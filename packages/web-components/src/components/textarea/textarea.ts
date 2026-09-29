import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { generateId } from '@design-lib/core';
import type { FieldChangeDetail } from '@design-lib/core';
import { inputBaseStyles } from '../../styles/input-base.styles';
import { defaultFontFamily } from '../../styles/default-font.styles';

export type TextareaResize = 'vertical' | 'horizontal' | 'both' | 'none';

/**
 * Área de texto multilínea. Soporta conteo de caracteres, resize configurable,
 * y todos los estados del input guideline (error, disabled, readonly, required).
 *
 * @fires {CustomEvent<FieldChangeDetail>} ui-input  - Al escribir
 * @fires {CustomEvent<FieldChangeDetail>} ui-change - Al confirmar valor (blur)
 * @fires {CustomEvent}                    ui-focus  - Al recibir foco
 * @fires {CustomEvent}                    ui-blur   - Al perder foco
 *
 * @csspart field    - Contenedor raíz (.input-wrap)
 * @csspart label    - Elemento <label>
 * @csspart textarea - Elemento <textarea> nativo
 * @csspart helper   - Texto de ayuda
 * @csspart error    - Mensaje de error
 * @csspart count    - Contador de caracteres
 */
@customElement('ui-textarea')
export class UiTextarea extends LitElement {
  static override styles = [
    defaultFontFamily,
    inputBaseStyles,
    css`
      :host { display: block; }

      /* ── Override: el campo crece con el contenido ──── */
      .input-field {
        height: auto;
        min-height: var(--ui-textarea-min-height, 80px);
        align-items: flex-start;
        padding: var(--wk-space-2, 8px) var(--wk-space-3, 12px);
      }

      /* ── Textarea nativo ────────────────────────────── */
      .native-textarea {
        flex: 1;
        min-width: 0;
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-family: inherit;
        font-size: var(--wk-font-size-b1, 0.875rem);
        color: var(--wk-color-on-surface, #37474f);
        line-height: 1.5;
        padding: 0;
        margin: 0;
        resize: var(--ui-textarea-resize, vertical);
      }

      .native-textarea::placeholder {
        color: var(--wk-color-on-surface-muted, #546e7a);
      }

      .input-field--disabled .native-textarea { cursor: not-allowed; resize: none; }
      .input-field--readonly .native-textarea { cursor: default;      resize: none; }

      /* ── Footer: helper/error + contador ───────────── */
      .textarea-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--wk-space-2, 8px);
      }

      .textarea-footer:empty { display: none; }

      /* ── Contador de caracteres ─────────────────────── */
      .char-count {
        flex-shrink: 0;
        font-size: var(--wk-font-size-b3, 0.8125rem);
        color: var(--wk-color-on-surface-muted, #546e7a);
        line-height: 1.25;
        white-space: nowrap;
      }

      .char-count--over {
        color: var(--wk-color-danger, #ed0c10);
        font-weight: var(--wk-font-weight-medium, 500);
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
  @property({ type: Number }) rows = 3;
  @property() resize: TextareaResize = 'vertical';
  @property({ type: Number, attribute: 'max-length' }) maxLength?: number;
  @property({ type: Boolean, attribute: 'show-count' }) showCount = false;
  @property({ type: Boolean, reflect: true }) disabled  = false;
  @property({ type: Boolean, reflect: true }) readonly  = false;
  @property({ type: Boolean, reflect: true }) required  = false;
  @property({ type: Boolean, reflect: true }) invalid   = false;
  @property({ attribute: 'helper-text' }) helperText = '';
  @property({ attribute: 'error-text' })  errorText  = '';

  // ── IDs para accesibilidad ───────────────────────────────────────
  private readonly _textareaId = generateId('ui-textarea');
  private readonly _helperId   = generateId('ui-ta-helper');
  private readonly _errorId    = generateId('ui-ta-error');

  // ── Getters ──────────────────────────────────────────────────────
  private get _showError(): boolean {
    return this.invalid && Boolean(this.errorText);
  }

  private get _charCount(): number {
    return this.value.length;
  }

  private get _isOverLimit(): boolean {
    return this.maxLength !== undefined && this._charCount > this.maxLength;
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
    const value = (e.target as HTMLTextAreaElement).value;
    this.value = value;
    this._emit<FieldChangeDetail>('ui-input', { value });
  }

  private _onChange(e: Event): void {
    this._emit<FieldChangeDetail>('ui-change', {
      value: (e.target as HTMLTextAreaElement).value,
    });
  }

  // ── Render ───────────────────────────────────────────────────────
  override render() {
    const showCount = this.showCount || this.maxLength !== undefined;

    return html`
      <div class="input-wrap" part="field">

        ${this.label ? html`
          <label
            class=${`input-label${this.required ? ' input-label--required' : ''}`}
            for=${this._textareaId}
            part="label"
          >${this.label}</label>
        ` : nothing}

        <div
          class=${classMap({
            'input-field':           true,
            'input-field--error':    this.invalid || this._isOverLimit,
            'input-field--disabled': this.disabled,
            'input-field--readonly': this.readonly,
          })}
          style="--ui-textarea-resize:${this.resize}"
        >
          <textarea
            id=${this._textareaId}
            class="native-textarea"
            part="textarea"
            name=${ifDefined(this.name || undefined)}
            rows=${this.rows}
            maxlength=${ifDefined(this.maxLength)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            aria-required=${this.required ? 'true' : 'false'}
            aria-invalid=${(this.invalid || this._isOverLimit) ? 'true' : 'false'}
            aria-describedby=${ifDefined(this._describedBy)}
            @input=${this._onInput}
            @change=${this._onChange}
            @focus=${() => this._emit('ui-focus', {})}
            @blur=${() => this._emit('ui-blur', {})}
          >${this.value}</textarea>
        </div>

        <div class="textarea-footer">

          <div style="flex:1;min-width:0;">
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

          ${showCount ? html`
            <span
              class=${classMap({
                'char-count': true,
                'char-count--over': this._isOverLimit,
              })}
              part="count"
              aria-live="polite"
            >
              ${this.maxLength !== undefined
                ? `${this._charCount} / ${this.maxLength}`
                : `${this._charCount}`}
            </span>
          ` : nothing}

        </div>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-textarea': UiTextarea;
  }
}
