import { CSSResultGroup, html, LitElement, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from "../../styles/material-icons.styles";


@customElement('ui-kebab-option')
export class UiKebabOption extends LitElement {
  static override styles?: CSSResultGroup | undefined = [
    defaultFontFamily,
    materialIconsStyles,
    css`
      :host{
        .kebab-option{
          cursor: pointer;
          -webkit-user-select: none; /* Safari y Chrome antiguos */
          -moz-user-select: none;    /* Firefox antiguo */
          -ms-user-select: none;     /* Internet Explorer / Edge antiguo */
          user-select: none;         /* Propiedad estándar y moderna */

          -webkit-user-select: none; /* Safari */
          -moz-user-select: none;    /* Firefox */
          -ms-user-select: none;     /* Internet Explorer/Edge */
          user-select: none;         /* Estándar moderno */

          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: var(--wk-space-2);
        
          width: 100%;
          background-color: var(--wk-color-surface-raised);
          padding: var(--wk-space-2);
          box-sizing: border-box;
          color: var(--wk-color-on-surface-muted);
        }

        .kebab-option:hover{
          background-color: var(--wk-color-action-hover);
          color: var(--wk-white);
        }
        .kebab-option:active{
          background-color: var(--wk-color-action-active);
          color: var(--wk-white);
        }
      }
    `
  ]

  @property() icon: string = '';

  private _onClick(): void {
    this.dispatchEvent(new CustomEvent('ui-select', { bubbles: true, composed: true }));
  }

  override render(){
    return html`
      <a class="kebab-option" @click=${this._onClick}>
        ${ this.icon ? html`<i class="material-icons kebab-icon">${this.icon}</i>`: ' '}
        <span class="kebab-label"><slot></slot></span>
      </a>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-kebab-option': UiKebabOption;
  }
}