import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { generateId } from '@aolmosn/core';
import { inputBaseStyles } from '../../styles/input-base.styles';
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from '../../styles/material-icons.styles';
import type { CurrencyOption, CurrencyInputChangeDetail } from './currency-input.types';

/**
 * Input de monto monetario con selector de moneda, formato de miles
 * y decimales configurables.
 *
 * - El usuario escribe usando `.` como separador decimal y `,` como miles
 *   (formato en-US estándar para typing). El evento emite el valor numérico
 *   puro y una cadena formateada según el `locale` del componente.
 * - Si se pasa el arreglo `currencies`, el selector de moneda es interactivo.
 *   De lo contrario, muestra el símbolo de la moneda actual como decoración.
 * - La propiedad `decimals` sobreescribe el valor sugerido por la moneda.
 *   Con `decimals="0"` el campo solo acepta enteros.
 *
 * @fires {CustomEvent<CurrencyInputChangeDetail>} ui-input   - Cada keystroke
 * @fires {CustomEvent<CurrencyInputChangeDetail>} ui-change  - Al perder foco
 * @fires {CustomEvent<{ currency: string }>}      ui-currency-change - Al cambiar la moneda
 *
 * @csspart field    - Contenedor raíz (.input-wrap)
 * @csspart label    - Elemento <label>
 * @csspart trigger  - Botón selector de moneda
 * @csspart input    - Elemento <input> nativo
 * @csspart helper   - Texto de ayuda
 * @csspart error    - Mensaje de error
 */
@customElement('ui-currency-input')
export class UiCurrencyInput extends LitElement {
  static override styles = [
    defaultFontFamily,
    inputBaseStyles,
    materialIconsStyles,
    css`
      :host { display: block; }

      /* ── Selector de moneda (izquierda del input) ── */
      .currency-trigger {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
        padding: 0 var(--wk-space-2, 8px) 0 0;
        border: none;
        border-right: 1px solid var(--wk-color-border, #e2e8ea);
        margin-right: var(--wk-space-2, 8px);
        background: transparent;
        cursor: pointer;
        font-family: inherit;
        font-size: var(--wk-font-size-b2, 0.8125rem);
        font-weight: var(--wk-font-weight-medium, 500);
        color: var(--wk-color-on-surface-muted, #546e7a);
        line-height: 1;
        transition: color var(--wk-transition-normal, 0.15s ease);
        user-select: none;
        white-space: nowrap;
      }

      .currency-trigger:hover:not(:disabled) {
        color: var(--wk-color-on-surface, #37474f);
      }

      .currency-trigger:disabled,
      .currency-trigger--static {
        cursor: default;
        pointer-events: none;
      }

      .currency-trigger .material-icons {
        font-size: 16px;
        line-height: 1;
        transition: transform var(--wk-transition-normal, 0.15s ease);
      }

      .currency-trigger--open .material-icons {
        transform: rotate(180deg);
      }

      /* ── Input nativo ─────────────────────────────── */
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
        text-align: right;
      }

      .native-input::placeholder {
        color: var(--wk-color-on-surface-muted, #546e7a);
      }

      .input-field--disabled .native-input { cursor: not-allowed; }
      .input-field--readonly .native-input { cursor: default; }

      /* ── Asterisco requerido ──────────────────────── */
      .input-label--required::after {
        content: ' *';
        color: var(--wk-color-danger, #ed0c10);
      }

      /* ── Dropdown de monedas ──────────────────────── */
      .currency-dropdown {
        position: fixed;
        z-index: 9999;
        min-width: 220px;
        max-height: 280px;
        overflow-y: auto;
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-radius: var(--wk-radius-md, 6px);
        background: var(--wk-color-surface, #ffffff);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        overscroll-behavior: contain;
      }

      .currency-option {
        display: flex;
        align-items: center;
        gap: var(--wk-space-2, 8px);
        padding: var(--wk-space-2, 8px) var(--wk-space-3, 12px);
        cursor: pointer;
        transition: background var(--wk-transition-normal, 0.15s ease);
        font-size: var(--wk-font-size-b1, 0.875rem);
        color: var(--wk-color-on-surface, #37474f);
      }

      .currency-option:hover {
        background: var(--wk-color-surface-alt, #f6f7f8);
      }

      .currency-option--selected {
        background: var(--wk-color-action-subtle, #d3f0d3);
        color: var(--wk-color-action, #28892b);
        font-weight: var(--wk-font-weight-medium, 500);
      }

      .option-symbol {
        flex-shrink: 0;
        width: 24px;
        text-align: center;
        font-size: var(--wk-font-size-b1, 0.875rem);
        font-weight: var(--wk-font-weight-medium, 500);
        color: var(--wk-color-on-surface-muted, #546e7a);
      }

      .option-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .option-code {
        font-weight: var(--wk-font-weight-medium, 500);
        font-size: var(--wk-font-size-b2, 0.8125rem);
      }

      .option-name {
        font-size: var(--wk-font-size-b3, 0.75rem);
        color: var(--wk-color-on-surface-muted, #546e7a);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .option-check {
        flex-shrink: 0;
        font-size: 18px;
        color: var(--wk-color-action, #28892b);
      }
    `
  ];

  // ── Propiedades públicas ─────────────────────────────────────────
  @property({ type: Number }) value: number | null = null;
  /** Código de la moneda actualmente seleccionada (ej: 'USD', 'CLP'). */
  @property() currency = '';
  /** Lista de monedas disponibles. Si está vacío, no hay selector interactivo. */
  @property({ type: Array }) currencies: CurrencyOption[] = [];
  /**
   * Número de decimales permitidos. Sobreescribe el sugerido por la moneda.
   * 0 = solo enteros. undefined = usa el valor de la moneda o 2 por defecto.
   */
  @property({ type: Number }) decimals?: number;
  /** Locale para formatear el valor en eventos (ej: 'es-CL', 'en-US'). Default: navegador. */
  @property() locale = '';
  @property() label = '';
  @property() placeholder = '0';
  @property() name = '';
  @property({ type: Boolean, reflect: true }) disabled  = false;
  @property({ type: Boolean, reflect: true }) readonly  = false;
  @property({ type: Boolean, reflect: true }) required  = false;
  @property({ type: Boolean, reflect: true }) invalid   = false;
  @property({ attribute: 'helper-text' }) helperText = '';
  @property({ attribute: 'error-text' })  errorText  = '';
  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;

  // ── Estado interno ───────────────────────────────────────────────
  @state() private _open = false;
  @state() private _isFocused = false;
  @state() private _displayValue = '';
  @state() private _dropdownStyles: Record<string, string> = {};

  // ── IDs para accesibilidad ───────────────────────────────────────
  private readonly _inputId  = generateId('ui-currency');
  private readonly _helperId = generateId('ui-cur-helper');
  private readonly _errorId  = generateId('ui-cur-error');

  // ── Lifecycle ────────────────────────────────────────────────────
  override willUpdate(changed: PropertyValues): void {
    if (!this._isFocused) {
      if (changed.has('value') || changed.has('decimals') || changed.has('currency')) {
        this._displayValue = this._toInputFormat(this.value);
      }
    }
  }

  // ── Getters ──────────────────────────────────────────────────────
  private get _selectedCurrency(): CurrencyOption | undefined {
    return this.currencies.find(c => c.code === this.currency);
  }

  private get _currencySymbol(): string {
    return this._selectedCurrency?.symbol ?? this.currency ?? '';
  }

  private get _effectiveDecimals(): number {
    if (this.decimals !== undefined) return Math.max(0, this.decimals);
    return this._selectedCurrency?.decimals ?? 2;
  }

  private get _showError(): boolean {
    return this.invalid && Boolean(this.errorText);
  }

  private get _hasMultipleCurrencies(): boolean {
    return this.currencies.length > 1;
  }

  private get _describedBy(): string | undefined {
    const ids: string[] = [];
    if (this._showError)                     ids.push(this._errorId);
    if (!this._showError && this.helperText) ids.push(this._helperId);
    return ids.length ? ids.join(' ') : undefined;
  }

  // ── Formateo ─────────────────────────────────────────────────────
  /** Convierte el número al formato de tipeo: miles con coma, decimal con punto. */
  private _toInputFormat(value: number | null): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    const dec = this._effectiveDecimals;
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: dec,
    });
  }

  /** Formatea para los eventos (respeta el locale del componente). */
  private _toLocaleFormat(value: number | null): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    const dec = this._effectiveDecimals;
    const loc = this.locale || undefined;
    return value.toLocaleString(loc, {
      minimumFractionDigits: dec > 0 ? dec : 0,
      maximumFractionDigits: dec,
    });
  }

  /** Parsea el texto de tipeo (en-US style) a número. */
  private _parseInputText(text: string): number | null {
    if (!text || text.trim() === '') return null;
    const stripped = text.replace(/,/g, '');
    const num = parseFloat(stripped);
    return isNaN(num) ? null : num;
  }

  // ── Formateo en vivo mientras tipea ──────────────────────────────
  private _applyLiveFormat(inputEl: HTMLInputElement): void {
    const raw = inputEl.value;
    const selStart = inputEl.selectionStart ?? 0;

    // Contar chars no-coma antes del cursor (para recalcular posición)
    const nonCommasBefore = raw.slice(0, selStart).replace(/,/g, '').length;

    // 1. Quitar separadores de miles existentes
    let stripped = raw.replace(/,/g, '');

    // 2. Solo dígitos y un único punto decimal
    stripped = stripped.replace(/[^0-9.]/g, '');
    const firstDot = stripped.indexOf('.');
    if (firstDot !== -1) {
      stripped = stripped.slice(0, firstDot + 1)
        + stripped.slice(firstDot + 1).replace(/\./g, '');
    }

    // 3. Sin decimales permitidos → eliminar punto
    const dec = this._effectiveDecimals;
    if (dec === 0) {
      stripped = stripped.replace(/\./g, '');
    } else {
      const dot = stripped.indexOf('.');
      if (dot !== -1 && stripped.length - dot - 1 > dec) {
        stripped = stripped.slice(0, dot + 1 + dec);
      }
    }

    // 4. Formatear parte entera con comas
    const dot = stripped.indexOf('.');
    const intPart = dot === -1 ? stripped : stripped.slice(0, dot);
    const decPart = dot === -1 ? '' : stripped.slice(dot);
    const formattedInt = intPart
      ? parseInt(intPart, 10).toLocaleString('en-US')
      : '';
    const formatted = formattedInt + decPart;

    // 5. Recalcular posición del cursor contando non-comas en la cadena nueva
    let newCursor = formatted.length; // fallback: al final
    let count = 0;
    for (let i = 0; i <= formatted.length; i++) {
      if (count === nonCommasBefore) { newCursor = i; break; }
      if (i < formatted.length && formatted[i] !== ',') count++;
    }

    // 6. Actualizar DOM directamente (live() evitará reasignación redundante)
    inputEl.value = formatted;
    inputEl.setSelectionRange(newCursor, newCursor);

    this._displayValue = formatted;
  }

  // ── Handlers del input ────────────────────────────────────────────
  private _onInput(e: Event): void {
    const inputEl = e.target as HTMLInputElement;
    this._applyLiveFormat(inputEl);

    const numValue = this._parseInputText(this._displayValue);
    this.value = numValue;
    this._emitCurrencyDetail('ui-input', numValue);
  }

  private _onFocus(): void {
    this._isFocused = true;
    this._emitRaw('ui-focus');
  }

  private _onBlur(): void {
    this._isFocused = false;
    const numValue = this._parseInputText(this._displayValue);
    this.value = numValue;
    // Reformatear al perder foco (aplica min/max y limpia "1." → "1")
    if (numValue !== null) {
      const clamped = this._clamp(numValue);
      this.value = clamped;
      this._displayValue = this._toInputFormat(clamped);
    } else {
      this._displayValue = '';
    }
    this._emitCurrencyDetail('ui-change', this.value);
    this._emitRaw('ui-blur');
  }

  private _clamp(n: number): number {
    let v = n;
    if (this.min !== undefined && v < this.min) v = this.min;
    if (this.max !== undefined && v > this.max) v = this.max;
    return v;
  }

  // ── Handlers del selector de moneda ──────────────────────────────
  private _openDropdown(): void {
    if (!this._hasMultipleCurrencies || this.disabled || this.readonly) return;
    this._updatePosition();
    this._open = true;
    document.addEventListener('click', this._onDocClick, true);
    window.addEventListener('scroll', this._updatePosition, { passive: true, capture: true });
    window.addEventListener('resize', this._updatePosition);
  }

  private _closeDropdown(): void {
    this._open = false;
    document.removeEventListener('click', this._onDocClick, true);
    window.removeEventListener('scroll', this._updatePosition, true);
    window.removeEventListener('resize', this._updatePosition);
  }

  private _selectCurrency(opt: CurrencyOption): void {
    if (opt.code === this.currency) { this._closeDropdown(); return; }
    this.currency = opt.code;
    this._closeDropdown();
    // Si la nueva moneda tiene un preset de decimales diferente y no hay override explícito,
    // reformatear el valor mostrado con los nuevos decimales efectivos
    this._displayValue = this._toInputFormat(this.value);
    this._emitRaw('ui-currency-change', { currency: opt.code });
    this._emitCurrencyDetail('ui-change', this.value);
  }

  private readonly _onDocClick = (e: MouseEvent): void => {
    if (!e.composedPath().includes(this)) this._closeDropdown();
  };

  private readonly _updatePosition = (): void => {
    const trigger = this.shadowRoot?.querySelector('.currency-trigger');
    if (!trigger) return;
    const rect = (trigger as HTMLElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < 120 && spaceAbove > spaceBelow;

    this._dropdownStyles = dropUp
      ? { top: `${rect.top - 4}px`, left: `${rect.left}px`, transform: 'translateY(-100%)' }
      : { top: `${rect.bottom + 4}px`, left: `${rect.left}px` };
  };

  // ── Emisión de eventos ────────────────────────────────────────────
  private _emitCurrencyDetail(name: string, value: number | null): void {
    this.dispatchEvent(new CustomEvent<CurrencyInputChangeDetail>(name, {
      detail: {
        value,
        currency: this.currency,
        formatted: this._toLocaleFormat(value),
      },
      bubbles: true,
      composed: true,
    }));
  }

  private _emitRaw<T>(name: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(name, {
      detail: detail ?? {},
      bubbles: true,
      composed: true,
    }));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._closeDropdown();
  }

  // ── Render ───────────────────────────────────────────────────────
  private _renderCurrencyTrigger() {
    const isStatic = !this._hasMultipleCurrencies;
    return html`
      <button
        type="button"
        class=${classMap({
          'currency-trigger':       true,
          'currency-trigger--open':   this._open,
          'currency-trigger--static': isStatic,
        })}
        part="trigger"
        ?disabled=${this.disabled || this.readonly}
        aria-haspopup=${isStatic ? nothing : 'listbox'}
        aria-expanded=${this._open ? 'true' : 'false'}
        aria-label="Seleccionar moneda: ${this.currency}"
        tabindex=${isStatic ? '-1' : '0'}
        @click=${this._openDropdown}
      >
        ${this._currencySymbol
          ? html`<span>${this._currencySymbol}</span>`
          : nothing}
        <span style="min-width:28px;">${this.currency}</span>
        ${!isStatic ? html`
          <span class="material-icons" aria-hidden="true">expand_more</span>
        ` : nothing}
      </button>
    `;
  }

  private _renderDropdown() {
    if (!this._open) return nothing;
    return html`
      <div
        class="currency-dropdown"
        role="listbox"
        style=${styleMap(this._dropdownStyles)}
        aria-label="Monedas disponibles"
      >
        ${repeat(this.currencies, c => c.code, c => html`
          <div
            class=${classMap({
              'currency-option': true,
              'currency-option--selected': c.code === this.currency,
            })}
            role="option"
            aria-selected=${c.code === this.currency}
            @click=${() => this._selectCurrency(c)}
          >
            <span class="option-symbol">${c.symbol}</span>
            <div class="option-info">
              <span class="option-code">${c.code}</span>
              <span class="option-name">${c.name}</span>
            </div>
            ${c.code === this.currency ? html`
              <span class="material-icons option-check" aria-hidden="true">check</span>
            ` : nothing}
          </div>
        `)}
      </div>
    `;
  }

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
          'input-field--error':    this.invalid,
          'input-field--disabled': this.disabled,
          'input-field--readonly': this.readonly,
        })}>
          ${this._renderCurrencyTrigger()}
          <input
            id=${this._inputId}
            class="native-input"
            part="input"
            type="text"
            inputmode=${this._effectiveDecimals > 0 ? 'decimal' : 'numeric'}
            autocomplete="off"
            name=${ifDefined(this.name || undefined)}
            .value=${live(this._displayValue)}
            placeholder=${this.placeholder}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            aria-required=${this.required ? 'true' : 'false'}
            aria-invalid=${this.invalid ? 'true' : 'false'}
            aria-describedby=${ifDefined(this._describedBy)}
            @input=${this._onInput}
            @focus=${this._onFocus}
            @blur=${this._onBlur}
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

      ${this._renderDropdown()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-currency-input': UiCurrencyInput;
  }
}
