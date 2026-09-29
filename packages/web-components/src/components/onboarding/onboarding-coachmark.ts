import { CSSResultGroup, css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { defaultFontFamily } from '../../styles/default-font.styles';
import { ElementPositioner } from '../../utils/element-positioner';
import '../button/button';

const MOBILE_BREAKPOINT = 600;

@customElement('ui-onboarding-coachmark')
export class UiOnboardingCoachmark extends LitElement {
  static override styles?: CSSResultGroup = [
    defaultFontFamily,
    css`
      :host {
        .coachmark {
          box-sizing: border-box;
          position: fixed;
          z-index: 1001;
          width: 280px;
          background: var(--wk-color-surface-alt);
          border-radius: var(--wk-radius-md, 8px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
          padding: var(--wk-space-4, 16px);
          display: flex;
          flex-direction: column;
          gap: var(--wk-space-2, 8px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.25s ease, visibility 0.25s ease;
        }

        .coachmark.active {
          opacity: 1;
          visibility: visible;
        }

        .coachmark-counter {
          font-size: 0.75rem;
          color: var(--wk-color-on-surface, #9ca3af);
          font-weight: 500;
        }

        .coachmark-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--wk-color-on-surface, #111827);
        }

        .coachmark-description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--wk-color-on-surface, #4b5563);
          line-height: 1.5;
        }

        .coachmark-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--wk-space-2, 8px);
          gap: var(--wk-space-2, 8px);
        }

      }
    `,
  ];

  @property() heading     = '';
  @property() description = '';
  @property({ type: Number }) currentStep = 1;
  @property({ type: Number }) totalSteps  = 1;
  @property({ type: Boolean }) active     = false;

  private _positioner: ElementPositioner | null = null;
  private _triggerElement: Element | null = null;
  private _resizeHandler: (() => void) | null = null;
  private _lastIsMobile: boolean | null = null;

  private get _isMobile(): boolean {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._resizeHandler = () => {
      if (!this.active || !this._triggerElement) return;
      const isMobile = this._isMobile;
      if (isMobile !== this._lastIsMobile) {
        this._lastIsMobile = null; // forzar re-posicionamiento
        this._applyPosition();
      }
    };
    window.addEventListener('resize', this._resizeHandler);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    this._positioner?.stop();
  }

  showAt(triggerElement: Element): void {
    this._triggerElement = triggerElement;
    this._lastIsMobile   = null;
    this.active = true;
    this.updateComplete.then(() => this._applyPosition());
  }

  hide(): void {
    this.active          = false;
    this._triggerElement = null;
    this._lastIsMobile   = null;
    this._positioner?.stop();
    this._positioner = null;
  }

  private _applyPosition(): void {
    const coachmarkEl = this.renderRoot.querySelector('.coachmark') as HTMLElement;
    if (!coachmarkEl || !this._triggerElement) return;

    const isMobile = this._isMobile;
    this._lastIsMobile = isMobile;

    if (isMobile) {
      this._positioner?.stop();
      this._positioner = null;
      Object.assign(coachmarkEl.style, {
        top:    'auto',
        bottom: 'var(--safe-area-inset-bottom, 0px)',
        left:   '0',
        right:  '0',
        minWidth:  'fit-content',
        width: '100%',
        margin: 'auto'
      });
    } else {
      Object.assign(coachmarkEl.style, {
        top:    '',
        bottom: '',
        left:   '',
        right:  '',
        width:  '',
      });
      this._positioner?.stop();
      this._positioner = new ElementPositioner(this._triggerElement, coachmarkEl, { gap: 12 });
      this._positioner.start();
    }
  }

  private _onPrev(): void {
    this.dispatchEvent(new CustomEvent('ui-prev', { bubbles: true, composed: true }));
  }

  private _onNext(): void {
    this.dispatchEvent(new CustomEvent('ui-next', { bubbles: true, composed: true }));
  }

  private _onFinish(): void {
    this.dispatchEvent(new CustomEvent('ui-finish', { bubbles: true, composed: true }));
  }

  override render() {
    const isFirst = this.currentStep <= 1;
    const isLast  = this.currentStep >= this.totalSteps;

    return html`
      <div class="coachmark ${this.active ? 'active' : ''}">
        <span class="coachmark-counter">Paso ${this.currentStep} de ${this.totalSteps}</span>

        ${this.heading     ? html`<p class="coachmark-title">${this.heading}</p>`            : nothing}
        ${this.description ? html`<p class="coachmark-description">${this.description}</p>` : nothing}

        <div class="coachmark-footer">
          ${!isFirst
            ? html`<ui-button type="SECONDARY" leftIcon="arrow_back" @ui-click=${this._onPrev}>Anterior</ui-button>`
            : html`<span></span>`
          }
          ${isLast
            ? html`<ui-button @ui-click=${this._onFinish}>Finalizar</ui-button>`
            : html`<ui-button rigthIcon="arrow_forward" @ui-click=${this._onNext}>Siguiente</ui-button>`
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-onboarding-coachmark': UiOnboardingCoachmark;
  }
}
