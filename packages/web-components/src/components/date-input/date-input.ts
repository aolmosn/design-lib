import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { generateId } from '@design-lib/core';
import type { ComponentSize } from '@design-lib/core';
import { inputBaseStyles } from '../../styles/input-base.styles';
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from '../../styles/material-icons.styles';
import '../calendar/calendar';

// ── Tipos exportados ─────────────────────────────────────────────────────────

export interface DateInputChangeSingle {
  mode:  'single';
  value: string;   // YYYY-MM-DD
  date:  Date;
}

export interface DateInputChangeRange {
  mode:     'range';
  from:     string;  // YYYY-MM-DD
  to:       string;  // YYYY-MM-DD
  fromDate: Date;
  toDate:   Date;
}

export type DateInputChangeDetail = DateInputChangeSingle | DateInputChangeRange;

type Mode = 'single' | 'range';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(iso: string, locale: string): string {
  if (!iso) return '';
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}

/**
 * Campo de fecha con calendario flotante. Soporta modo `single` (una fecha) y
 * `range` (rango de fechas). Se integra con el sistema de estilos del design
 * system (label, helper-text, error-text, estados invalid/disabled/required).
 *
 * **Modo single** — trigger muestra la fecha formateada; al seleccionar una
 * fecha el popover se cierra automáticamente.
 *
 * **Modo range** — trigger muestra "inicio → fin"; el popover permanece
 * abierto hasta que el usuario pulsa "Listo" (habilitado cuando hay rango
 * completo). Un botón × en el trigger limpia el rango confirmado.
 *
 * @fires {CustomEvent<DateInputChangeDetail>} ui-change — fecha/rango confirmado
 * @fires {CustomEvent}                        ui-clear  — valor limpiado (range)
 *
 * @csspart field  — contenedor del trigger (.input-field)
 * @csspart label  — elemento <label>
 */
@customElement('ui-input-date')
export class UiInputDate extends LitElement {
  static override styles = [
    defaultFontFamily,
    materialIconsStyles,
    inputBaseStyles,
    css`
      :host { display: block; }

      /* ── Trigger ──────────────────────────────────────── */
      .trigger {
        all: unset;
        display: flex;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
        cursor: pointer;
      }

      .input-field--disabled .trigger { cursor: not-allowed; }

      /* ── Ícono de calendario ────────────────────────────  */
      .cal-icon {
        flex-shrink: 0;
        font-size: 1.125rem;
        line-height: 1;
        color: var(--wk-color-danger-on, #546e7a);
        transition: color var(--wk-transition-normal, 0.15s ease);
        pointer-events: none;
        user-select: none;
      }

      .input-field--focused .cal-icon,
      .input-field--open    .cal-icon { color: var(--wk-color-focus, #2772cc); }
      .input-field--error   .cal-icon { color: var(--wk-color-danger-on #ed0c10); }

      /* ── Separador de rango ─────────────────────────────── */
      .range-sep {
        flex-shrink: 0;
        font-size: 0.875rem;
        color: var(--wk-color-on-surface-muted, #546e7a);
        padding: 0 2px;
        pointer-events: none;
        user-select: none;
      }

      /* ── Botón limpiar (solo rango) ─────────────────────── */
      .clear-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        font-size: 1rem;
        line-height: 1;
        color: var(--wk-color-on-surface-muted, #546e7a);
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.12s, color 0.12s;
      }

      .clear-btn:hover {
        background: var(--wk-color-surface-alt, #f6f7f8);
        color: var(--wk-color-danger, #ed0c10);
      }

      /* ── Popover flotante ───────────────────────────────── */
      .popover {
        position: fixed;
        z-index: var(--wk-z-popover, 9999);
        background: var(--wk-color-surface, #fff);
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-radius: var(--wk-radius-lg, 8px);
        box-shadow:
          0 4px 6px -1px rgb(0 0 0 / 0.08),
          0 10px 24px -4px rgb(0 0 0 / 0.12);
        overflow: hidden;
        opacity: 0;
        transform: translateY(-6px) scale(0.98);
        pointer-events: none;
        transition:
          opacity 0.14s ease,
          transform 0.14s ease;
        /* Layout interno: calendario scrollable + footer fijo */
        display: flex;
        flex-direction: column;
      }

      .popover--open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      /* Wrapper del calendario: ocupa el espacio disponible y hace scroll */
      .popover-calendar {
        flex: 1 1 auto;
        overflow-y: auto;
        min-height: 0;
      }

      /* ── Footer del popover (rango) ─────────────────────── */
      .popover-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-top: 1px solid var(--wk-color-border, #e2e8ea);
        background: var(--wk-color-surface-alt, #f6f7f8);
        gap: 8px;
      }

      .popover-footer__range-label {
        font-size: 0.8125rem;
        color: var(--wk-color-on-surface-muted, #546e7a);
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .popover-footer__range-label strong {
        color: var(--wk-color-on-surface, #37474f);
        font-weight: 600;
      }

      .done-btn {
        all: unset;
        padding: 6px 16px;
        background: var(--wk-color-action, #28892b);
        color: #fff;
        font-size: 0.8125rem;
        font-weight: 600;
        border-radius: var(--wk-radius-md, 6px);
        cursor: pointer;
        flex-shrink: 0;
        transition: opacity 0.12s;
        line-height: 1.4;
      }

      .done-btn:disabled {
        background: var(--wk-color-border, #e2e8ea);
        color: var(--wk-color-on-surface-muted, #546e7a);
        cursor: not-allowed;
      }

      .done-btn:not(:disabled):hover { opacity: 0.88; }

      /* ── Tamaños ────────────────────────────────────────── */
      .input-field--sm { height: 32px; padding: 0 8px; gap: 6px; }
      .input-field--sm .input-value,
      .input-field--sm .input-placeholder { font-size: var(--wk-font-size-b3, 0.8125rem); }
      .input-field--sm .cal-icon { font-size: 1rem; }

      .input-field--lg { height: 48px; padding: 0 16px; }
      .input-field--lg .input-value,
      .input-field--lg .input-placeholder { font-size: var(--wk-font-size-md, 1rem); }
    `,
  ];

  // ── Propiedades públicas ──────────────────────────────────────────────────
  @property() mode: Mode = 'single';
  @property() label       = '';
  @property() placeholder = '';
  @property() name        = '';
  @property() size: ComponentSize = 'md';
  @property() locale      = 'es-CL';

  /** Valor en modo single (ISO YYYY-MM-DD) */
  @property() value = '';
  /** Fecha inicio en modo range (ISO YYYY-MM-DD) */
  @property() from  = '';
  /** Fecha fin en modo range (ISO YYYY-MM-DD) */
  @property() to    = '';

  @property({ attribute: 'min-date' })    minDate    = '';
  @property({ attribute: 'max-date' })    maxDate    = '';
  @property({ attribute: 'helper-text' }) helperText = '';
  @property({ attribute: 'error-text' })  errorText  = '';

  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) invalid  = false;

  // ── Estado interno ────────────────────────────────────────────────────────
  @state() private _open = false;
  @state() private _popoverStyles: Record<string, string> = {};
  @state() private _calViewDate = '';

  @query('.popover') private _popoverEl?: HTMLElement;

  /**
   * Estado pendiente del rango mientras el popover está abierto.
   * Solo se confirma al pulsar "Listo".
   */
  @state() private _pendingFrom     = '';
  @state() private _pendingTo       = '';
  @state() private _pendingFromDate: Date | null = null;
  @state() private _pendingToDate:   Date | null = null;

  private readonly _fieldId  = generateId('ui-id');
  private readonly _helperId = generateId('ui-id-h');

  // ── Getters de display ────────────────────────────────────────────────────
  private get _loc(): string { return this.locale || 'es-CL'; }

  private get _placeholderText(): string {
    return this.placeholder || (this.mode === 'range' ? 'Selecciona un rango' : 'Selecciona una fecha');
  }

  private get _hasValue(): boolean {
    return this.mode === 'single' ? !!this.value : !!(this.from && this.to);
  }

  // ── Outside-click / Escape ────────────────────────────────────────────────
  private readonly _onDocClick = (e: MouseEvent): void => {
    if (!this._open) return;
    if (e.composedPath().includes(this)) return;
    this._closePopover();
  };

  private readonly _onDocKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._open) this._closePopover();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click',   this._onDocClick, { capture: true });
    document.addEventListener('keydown', this._onDocKey,   { capture: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click',   this._onDocClick, { capture: true });
    document.removeEventListener('keydown', this._onDocKey,   { capture: true });
  }

  // ── Apertura / cierre ─────────────────────────────────────────────────────
  private readonly _boundUpdatePos = () => this._updatePosition();

  private _toggle(e: Event): void {
    e.stopPropagation();
    if (this.disabled) return;
    this._open ? this._closePopover() : this._openPopover();
  }

  /** Calcula el mes que debe mostrar el calendar al abrir el popover. */
  private _resolveInitialViewDate(): string {
    // Si hay valor seleccionado, mostrar ese mes
    const anchor = this.mode === 'single' ? this.value : (this.from || '');
    if (anchor) {
      const [y, m] = anchor.split('-');
      return `${y}-${m}`;
    }
    // Si la fecha actual está dentro del rango min/max → dejar que el calendar
    // use el mes de hoy (retornamos '' para no sobrescribir)
    const today = new Date();
    const todayISO = toISO(today);
    const afterMin = !this.minDate || todayISO >= this.minDate;
    const beforeMax = !this.maxDate || todayISO <= this.maxDate;
    if (afterMin && beforeMax) return '';
    // Fuera de rango: navegar al mes de minDate (si existe), si no al de maxDate
    if (this.minDate) {
      const [y, m] = this.minDate.split('-');
      return `${y}-${m}`;
    }
    if (this.maxDate) {
      const [y, m] = this.maxDate.split('-');
      return `${y}-${m}`;
    }
    return '';
  }

  private _openPopover(): void {
    // Sincroniza estado pendiente con los valores confirmados al abrir
    this._pendingFrom     = this.from;
    this._pendingTo       = this.to;
    this._pendingFromDate = null;
    this._pendingToDate   = null;

    this._calViewDate = this._resolveInitialViewDate();
    this._open = true;
    this._updatePosition();

    window.addEventListener('scroll', this._boundUpdatePos, { passive: true, capture: true });
    window.addEventListener('resize', this._boundUpdatePos);
  }

  private _closePopover(): void {
    this._open = false;
    window.removeEventListener('scroll', this._boundUpdatePos, true);
    window.removeEventListener('resize', this._boundUpdatePos);
  }

  private _updatePosition(): void {
    if (!this._open) return;
    const field = this.shadowRoot?.querySelector('.input-field');
    if (!field) return;

    const rect     = field.getBoundingClientRect();
    const MARGIN   = 6;
    const EDGE_PAD = 8;
    const MAX_H    = 440;

    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top            - MARGIN;
    const openAbove  = spaceBelow < 200 && spaceAbove > spaceBelow;

    const maxHeight = Math.max(Math.min(openAbove ? spaceAbove : spaceBelow, MAX_H), 160);
    const left      = `${Math.min(rect.left, window.innerWidth - 288 - EDGE_PAD)}px`;

    this._popoverStyles = openAbove
      ? {
          // Ancla el borde inferior del popover al borde superior del input
          bottom:    `${window.innerHeight - rect.top + MARGIN}px`,
          top:       'auto',
          left,
          maxHeight: `${maxHeight}px`,
        }
      : {
          top:       `${rect.bottom + MARGIN}px`,
          bottom:    'auto',
          left,
          maxHeight: `${maxHeight}px`,
        };
  }

  // ── Eventos del calendario ────────────────────────────────────────────────
  private _onCalendarChange(e: Event): void {
    const detail = (e as CustomEvent).detail as { date?: Date; from?: Date; to?: Date };

    if (this.mode === 'single' && detail.date) {
      this.value = toISO(detail.date);
      this._closePopover();
      this._emit('ui-change', { mode: 'single', value: this.value, date: detail.date } satisfies DateInputChangeSingle);
      return;
    }

    // Range: bufferea el estado pendiente hasta "Listo"
    if (this.mode === 'range' && detail.from && detail.to) {
      this._pendingFrom     = toISO(detail.from);
      this._pendingTo       = toISO(detail.to);
      this._pendingFromDate = detail.from;
      this._pendingToDate   = detail.to;
    }
  }

  private _onDone(): void {
    if (!this._pendingFrom || !this._pendingTo) return;
    this.from = this._pendingFrom;
    this.to   = this._pendingTo;
    this._closePopover();
    this._emit('ui-change', {
      mode: 'range',
      from:     this.from,
      to:       this.to,
      fromDate: this._pendingFromDate!,
      toDate:   this._pendingToDate!,
    } satisfies DateInputChangeRange);
  }

  private _onClear(e: Event): void {
    e.stopPropagation();
    this.from = '';
    this.to   = '';
    this._pendingFrom = '';
    this._pendingTo   = '';
    this._emit('ui-clear', {});
  }

  private _emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  override render() {
    const isSingle = this.mode === 'single';
    const hasValue = this._hasValue;

    const fieldClasses = classMap({
      'input-field':          true,
      'input-field--focused': this._open,
      'input-field--open':    this._open,
      'input-field--error':   this.invalid,
      'input-field--filled':  hasValue,
      'input-field--disabled': this.disabled,
      'input-field--sm': this.size === 'sm',
      'input-field--lg': this.size === 'lg',
    });


    // ── Contenido del trigger ─────────────────────────────
    const triggerContent = isSingle
      ? this._renderSingleTrigger()
      : this._renderRangeTrigger();

    return html`
      <div class="input-wrap" part="wrap">

        ${this.label ? html`
          <label class="input-label" for=${this._fieldId} part="label">
            ${this.label}
            ${this.required ? html`<span aria-hidden="true" style="color:var(--wk-color-danger,#ed0c10);"> *</span>` : nothing}
          </label>
        ` : nothing}

        <div
          id=${this._fieldId}
          class=${fieldClasses}
          part="field"
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded=${this._open}
          tabindex=${this.disabled ? -1 : 0}
          @click=${this._toggle}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggle(e); }
          }}
        >
          <span class="cal-icon material-icons" aria-hidden="true">calendar_month</span>
          ${triggerContent}
        </div>

        ${this.invalid && this.errorText ? html`
          <span id=${this._helperId} class="input-error-msg" part="error" role="alert">
            <span class="material-icons" style="font-size:0.9rem;">error_outline</span>
            ${this.errorText}
          </span>
        ` : this.helperText ? html`
          <span id=${this._helperId} class="input-helper" part="helper">${this.helperText}</span>
        ` : nothing}

      </div>

      <!-- ── Popover ── -->
      <div
        class=${classMap({ popover: true, 'popover--open': this._open })}
        style=${styleMap(this._popoverStyles)}
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar ${isSingle ? 'fecha' : 'rango de fechas'}"
        @click=${(e: Event) => e.stopPropagation()}
      >
        <div class="popover-calendar">
          <ui-calendar
            mode=${this.mode}
            .value=${isSingle ? this.value : ''}
            .from=${!isSingle ? (this._pendingFrom || this.from) : ''}
            .to=${!isSingle ? (this._pendingTo || this.to) : ''}
            .minDate=${this.minDate}
            .maxDate=${this.maxDate}
            .viewDate=${this._calViewDate}
            .compact=${true}
            locale=${this._loc}
            @ui-change=${this._onCalendarChange}
          ></ui-calendar>
        </div>

        ${!isSingle ? this._renderRangeFooter() : nothing}
      </div>
    `;
  }

  // ── Renders parciales ─────────────────────────────────────────────────────

  private _renderSingleTrigger() {
    return this.value
      ? html`<span class="input-value">${formatDate(this.value, this._loc)}</span>`
      : html`<span class="input-placeholder">${this._placeholderText}</span>`;
  }

  private _renderRangeTrigger() {
    if (!this.from && !this.to) {
      return html`<span class="input-placeholder">${this._placeholderText}</span>`;
    }

    return html`
      ${this.from
        ? html`<span class="input-value" style="flex:0 1 auto;min-width:0;">${formatDate(this.from, this._loc)}</span>`
        : html`<span class="input-placeholder" style="flex:0 1 auto;">Inicio</span>`}
      <span class="range-sep" aria-hidden="true">→</span>
      ${this.to
        ? html`<span class="input-value" style="flex:0 1 auto;min-width:0;">${formatDate(this.to, this._loc)}</span>`
        : html`<span class="input-placeholder" style="flex:0 1 auto;">Fin</span>`}
      <span style="flex:1;"></span>
      ${!this.disabled ? html`
        <button
          class="clear-btn"
          type="button"
          aria-label="Limpiar rango"
          tabindex="-1"
          @click=${this._onClear}
        >×</button>
      ` : nothing}
    `;
  }

  private _renderRangeFooter() {
    const hasPending = !!(this._pendingFrom && this._pendingTo);
    const label = hasPending
      ? html`<span class="popover-footer__range-label">
          <strong>${formatDate(this._pendingFrom, this._loc)}</strong>
          &nbsp;→&nbsp;
          <strong>${formatDate(this._pendingTo, this._loc)}</strong>
        </span>`
      : html`<span class="popover-footer__range-label">Selecciona inicio y fin</span>`;

    return html`
      <div class="popover-footer">
        ${label}
        <button
          class="done-btn"
          type="button"
          ?disabled=${!hasPending}
          @click=${this._onDone}
        >Listo</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-input-date': UiInputDate;
  }
}
