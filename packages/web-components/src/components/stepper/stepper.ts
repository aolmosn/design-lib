import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from '../../styles/material-icons.styles';
import type { StepConfig, StepperChangeDetail } from './stepper.types';

/**
 * Stepper horizontal con barra de progreso, dots numerados y navegación
 * por botones o eventos externos.
 *
 * Contenido por paso: `<div slot="step-1">`, `<div slot="step-2">`, etc.
 * El componente muestra/oculta automáticamente el panel del paso activo.
 *
 * Validación: `[valid]="[canLeaveStep1, canLeaveStep2, ...]"` — si
 * `valid[i] === false` el botón "siguiente" queda deshabilitado en el paso i+1.
 *
 * Eventos externos escuchados (despachados sobre el elemento):
 *   - `ui-stepper-next`          — avanza si puede
 *   - `ui-stepper-prev`          — retrocede si puede
 *   - `ui-stepper-go` ({ step }) — salta al paso indicado
 *
 * @fires {CustomEvent<StepperChangeDetail>} ui-step — cambia de paso
 *
 * @csspart header  — barra superior (dots + counter + botones)
 * @csspart info    — fila con label del paso y porcentaje
 * @csspart bar     — barra de progreso
 * @csspart panels  — contenedor de los slots de contenido
 */
@customElement('ui-stepper')
export class UiStepper extends LitElement {
  static override styles = [
    defaultFontFamily,
    materialIconsStyles,
    css`
      :host {
        display: block;
        font-size: var(--wk-font-size-b1, 0.875rem);
      }

      /* ── Contenedor raíz ────────────────────────────── */
      .stepper-root {
        display: flex;
        flex-direction: column;
      }

      /* ── Fila de navegación (dots + counter + btns) ─── */
      .stepper-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--wk-color-surface-alt, #f6f7f8);
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-radius: var(--wk-radius-lg, 8px) var(--wk-radius-lg, 8px) 0 0;
      }

      /* ── Track de dots ──────────────────────────────── */
      .step-track {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .connector {
        flex: 1 1 0;
        height: 2px;
        min-width: 6px;
        max-width: 48px;
        background: var(--wk-color-border, #e2e8ea);
        border-radius: 1px;
        transition: background 0.35s ease;
      }

      .connector--done {
        background: var(--wk-color-action, #28892b);
      }

      .step-dot {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid var(--wk-color-border, #e2e8ea);
        background: var(--wk-color-surface, #ffffff);
        color: var(--wk-color-on-surface-muted, #546e7a);
        font-family: inherit;
        font-size: 0.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        cursor: default;
        outline: none;
        transition:
          background 0.25s ease,
          border-color 0.25s ease,
          box-shadow 0.25s ease,
          width 0.2s ease,
          height 0.2s ease;
      }

      .step-dot .material-icons { font-size: 15px; }

      .step-dot--done {
        background: var(--wk-color-action, #28892b);
        border-color: var(--wk-color-action, #28892b);
        color: #ffffff;
        cursor: pointer;
      }

      .step-dot--done:hover {
        background: color-mix(in srgb, var(--wk-color-action, #28892b) 80%, black);
      }

      .step-dot--done:focus-visible {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--wk-color-action, #28892b) 30%, transparent);
      }

      .step-dot--current {
        width: 32px;
        height: 32px;
        font-size: 0.8125rem;
        background: var(--wk-color-focus, #2772cc);
        border-color: var(--wk-color-focus, #2772cc);
        color: #ffffff;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--wk-color-focus, #2772cc) 22%, transparent);
      }

      /* ── Counter "Paso N de Total" ──────────────────── */
      .step-counter {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--wk-color-on-surface, #37474f);
        white-space: nowrap;
        flex-shrink: 0;
      }

      /* ── Botones prev / next ────────────────────────── */
      .nav-btns {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-radius: var(--wk-radius-md, 6px);
        background: var(--wk-color-surface, #ffffff);
        color: var(--wk-color-on-surface, #37474f);
        cursor: pointer;
        font-family: inherit;
        outline: none;
        transition:
          background var(--wk-transition-normal, 0.15s ease),
          border-color var(--wk-transition-normal, 0.15s ease);
      }

      .nav-btn .material-icons { font-size: 20px; }

      .nav-btn:hover:not(:disabled) {
        background: var(--wk-color-surface-raised, #eff0f1);
        border-color: var(--wk-color-border-strong, #546e7a);
      }

      .nav-btn:focus-visible {
        border-color: var(--wk-color-focus, #2772cc);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--wk-color-focus, #2772cc) 18%, transparent);
      }

      .nav-btn:disabled {
        opacity: 0.35;
        cursor: default;
        pointer-events: none;
      }

      /* ── Fila de info: label + % ────────────────────── */
      .step-info {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 16px 6px;
        border-left: 1px solid var(--wk-color-border, #e2e8ea);
        border-right: 1px solid var(--wk-color-border, #e2e8ea);
        background: var(--wk-color-surface, #ffffff);
      }

      .step-label-wrap {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .step-label {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--wk-color-on-surface, #37474f);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .step-desc {
        font-size: 0.8125rem;
        color: var(--wk-color-on-surface-muted, #546e7a);
      }

      .progress-pct {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--wk-color-action, #28892b);
        white-space: nowrap;
        flex-shrink: 0;
      }

      /* ── Barra de progreso ──────────────────────────── */
      .progress-wrap {
        padding: 0 16px 12px;
        border-left: 1px solid var(--wk-color-border, #e2e8ea);
        border-right: 1px solid var(--wk-color-border, #e2e8ea);
        background: var(--wk-color-surface, #ffffff);
      }

      .progress-bar {
        height: 6px;
        background: var(--wk-color-border, #e2e8ea);
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--wk-color-action, #28892b);
        border-radius: inherit;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* ── Contenedor de slots ────────────────────────── */
      .step-panels {
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-top: none;
        border-radius: 0 0 var(--wk-radius-lg, 8px) var(--wk-radius-lg, 8px);
        background: var(--wk-color-surface, #ffffff);
        overflow: hidden;
      }

      slot { display: none; }

      slot.panel--active {
        display: block;
        animation: step-in 0.2s ease;
      }

      @keyframes step-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `
  ];

  // ── Props públicas ───────────────────────────────────────────────
  /** Definición de cada paso. Se pasa como propiedad JS. */
  @property({ type: Array, attribute: false }) steps: StepConfig[] = [];

  /**
   * Paso actual (1-based) para modo controlado.
   * Al cambiar externamente, sincroniza el estado interno.
   */
  @property({ type: Number }) current = 1;

  /**
   * Array de booleanos que controla si se puede avanzar desde cada paso.
   * `valid[0]` controla si se puede salir del paso 1 → paso 2.
   * `undefined` (o fuera de rango) se trata como `true`.
   */
  @property({ type: Array, attribute: false }) valid: boolean[] = [];

  // ── Estado interno ───────────────────────────────────────────────
  @state() private _current = 1;

  // ── Sync desde props ─────────────────────────────────────────────
  override willUpdate(changed: PropertyValues): void {
    if (changed.has('current')) {
      const total = this.steps.length || 1;
      this._current = Math.max(1, Math.min(this.current, total));
    }
  }

  // ── Eventos externos ─────────────────────────────────────────────
  private readonly _onExternalNext = (): void => { this._goNext(); };
  private readonly _onExternalPrev = (): void => { this._goPrev(); };
  private readonly _onExternalGo   = (e: Event): void => {
    const step = (e as CustomEvent<{ step: number }>).detail?.step;
    if (typeof step === 'number') this._goTo(step, 'jump');
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('ui-stepper-next', this._onExternalNext);
    this.addEventListener('ui-stepper-prev', this._onExternalPrev);
    this.addEventListener('ui-stepper-go',   this._onExternalGo);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('ui-stepper-next', this._onExternalNext);
    this.removeEventListener('ui-stepper-prev', this._onExternalPrev);
    this.removeEventListener('ui-stepper-go',   this._onExternalGo);
  }

  // ── Getters ──────────────────────────────────────────────────────
  private get _total(): number { return this.steps.length; }

  private get _canAdvance(): boolean {
    if (this._current >= this._total) return false;
    return this.valid[this._current - 1] !== false;
  }

  private get _canGoBack(): boolean {
    return this._current > 1;
  }

  private get _progress(): number {
    if (this._total <= 0) return 0;
    if (this._total === 1) return 100;
    return Math.round((this._current / this._total) * 100);
  }

  // ── Navegación ───────────────────────────────────────────────────
  private _goTo(step: number, direction: 'next' | 'prev' | 'jump'): void {
    const target = Math.max(1, Math.min(step, this._total));
    if (target === this._current) return;
    const prev = this._current;
    this._current = target;
    this.dispatchEvent(new CustomEvent<StepperChangeDetail>('ui-step', {
      detail: { step: this._current, prev, direction },
      bubbles: true,
      composed: true,
    }));
  }

  private _goNext(): void { if (this._canAdvance) this._goTo(this._current + 1, 'next'); }
  private _goPrev(): void { if (this._canGoBack)  this._goTo(this._current - 1, 'prev'); }

  // ── Render ───────────────────────────────────────────────────────
  private _renderDots() {
    return this.steps.map((step, i) => {
      const stepN   = i + 1;
      const isDone  = stepN < this._current;
      const isCurr  = stepN === this._current;

      return html`
        ${i > 0 ? html`
          <div class="connector ${isDone ? 'connector--done' : ''}"></div>
        ` : nothing}
        <button
          class=${classMap({
            'step-dot': true,
            'step-dot--done':    isDone,
            'step-dot--current': isCurr,
            'step-dot--future':  !isDone && !isCurr,
          })}
          ?disabled=${!isDone}
          aria-label="Paso ${stepN}: ${step.label}"
          title="${step.label}"
          @click=${isDone ? () => this._goTo(stepN, 'jump') : nothing}
        >
          ${isDone
            ? html`<span class="material-icons">check</span>`
            : html`<span>${stepN}</span>`}
        </button>
      `;
    });
  }

  override render() {
    const currentStep = this.steps[this._current - 1];

    return html`
      <div class="stepper-root">

        <!-- ── Barra de navegación ─────────────────────── -->
        <div class="stepper-header" part="header">
          <div class="step-track" role="tablist">
            ${this._renderDots()}
          </div>

          <span class="step-counter">
            Paso ${this._current} de ${this._total}
          </span>

          <div class="nav-btns">
            <button
              class="nav-btn"
              ?disabled=${!this._canGoBack}
              aria-label="Paso anterior"
              title="Anterior"
              @click=${this._goPrev}
            >
              <span class="material-icons">chevron_left</span>
            </button>
            <button
              class="nav-btn"
              ?disabled=${!this._canAdvance}
              aria-label="Paso siguiente"
              title="Siguiente"
              @click=${this._goNext}
            >
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- ── Información del paso actual ─────────────── -->
        ${currentStep ? html`
          <div class="step-info" part="info">
            <div class="step-label-wrap">
              <span class="step-label">${currentStep.label}</span>
              ${currentStep.description
                ? html`<span class="step-desc">${currentStep.description}</span>`
                : nothing}
            </div>
            <span class="progress-pct">${this._progress}%</span>
          </div>
        ` : nothing}

        <!-- ── Barra de progreso ────────────────────────── -->
        <div class="progress-wrap" part="bar">
          <div
            class="progress-bar"
            role="progressbar"
            aria-valuenow=${this._progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Progreso: ${this._progress}%"
          >
            <div class="progress-fill" style="width: ${this._progress}%"></div>
          </div>
        </div>

        <!-- ── Paneles de contenido (slots) ─────────────── -->
        <div class="step-panels" part="panels">
          ${this.steps.map((_, i) => html`
            <slot
              name="step-${i + 1}"
              class=${this._current === i + 1 ? 'panel--active' : ''}
            ></slot>
          `)}
        </div>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-stepper': UiStepper;
  }
}
