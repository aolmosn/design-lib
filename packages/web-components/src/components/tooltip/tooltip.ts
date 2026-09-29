import { css, CSSResultGroup, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { defaultFontFamily } from '../../styles/default-font.styles';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@customElement('ui-tooltip')
export class UiTooltip extends LitElement {
  static override styles?: CSSResultGroup = [
    defaultFontFamily,
    css`
      :host {
        display: inline-block;
      }

      .box {
        position: fixed;
        z-index: 9999;
        pointer-events: none;

        background: var(--wk-color-surface-inverse, #1f2328);
        color: var(--wk-color-on-surface-inverse, #f0f6fc);
        font-family: var(--wk-font-family);
        font-size: var(--wk-font-size-b3, 0.75rem);
        line-height: 1.4;
        padding: 4px 8px;
        border-radius: var(--wk-radius-sm, 4px);
        max-width: 200px;
        white-space: normal;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);

        opacity: 0;
        transition: opacity 0.12s ease;

        &.visible { opacity: 1; }

        /* Arrow */
        &::after {
          content: '';
          position: absolute;
          border: 5px solid transparent;
        }

        &.top::after {
          top: 100%; left: 50%;
          transform: translateX(-50%);
          border-top-color: var(--wk-color-surface-inverse, #1f2328);
        }

        &.bottom::after {
          bottom: 100%; left: 50%;
          transform: translateX(-50%);
          border-bottom-color: var(--wk-color-surface-inverse, #1f2328);
        }

        &.left::after {
          left: 100%; top: 50%;
          transform: translateY(-50%);
          border-left-color: var(--wk-color-surface-inverse, #1f2328);
        }

        &.right::after {
          right: 100%; top: 50%;
          transform: translateY(-50%);
          border-right-color: var(--wk-color-surface-inverse, #1f2328);
        }
      }
    `,
  ];

  @property() content = '';
  @property() position: TooltipPosition = 'top';

  @state() private _visible = false;
  @state() private _top = 0;
  @state() private _left = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('mouseenter', this._show);
    this.addEventListener('mouseleave', this._hide);
    this.addEventListener('focusin',    this._show);
    this.addEventListener('focusout',   this._hide);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mouseenter', this._show);
    this.removeEventListener('mouseleave', this._hide);
    this.removeEventListener('focusin',    this._show);
    this.removeEventListener('focusout',   this._hide);
  }

  private _show = (): void => {
    if (!this.content) return;
    const r = this.getBoundingClientRect();
    const gap = 8;

    switch (this.position) {
      case 'top':    this._left = r.left + r.width / 2; this._top = r.top - gap;            break;
      case 'bottom': this._left = r.left + r.width / 2; this._top = r.bottom + gap;         break;
      case 'left':   this._left = r.left - gap;          this._top = r.top + r.height / 2;  break;
      case 'right':  this._left = r.right + gap;         this._top = r.top + r.height / 2;  break;
    }
    this._visible = true;
  };

  private _hide = (): void => { this._visible = false; };

  private _style(): string {
    switch (this.position) {
      case 'top':    return `left:${this._left}px;top:${this._top}px;transform:translateX(-50%) translateY(-100%)`;
      case 'bottom': return `left:${this._left}px;top:${this._top}px;transform:translateX(-50%)`;
      case 'left':   return `left:${this._left}px;top:${this._top}px;transform:translateX(-100%) translateY(-50%)`;
      case 'right':  return `left:${this._left}px;top:${this._top}px;transform:translateY(-50%)`;
    }
  }

  override render() {
    return html`
      <slot></slot>
      <div
        class="box ${this.position} ${this._visible ? 'visible' : ''}"
        style="${this._style()}"
        role="tooltip"
        aria-hidden="${String(!this._visible)}"
      >${this.content}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-tooltip': UiTooltip;
  }
}
