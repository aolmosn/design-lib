import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { defaultFontFamily } from "../../styles/default-font.styles";
import { materialIconsStyles } from "../../styles/material-icons.styles";
import { classMap } from "lit/directives/class-map.js";

@customElement('ui-chip')
export class UiChip extends LitElement{
  static override styles?: CSSResultGroup | undefined = [
      defaultFontFamily,
      materialIconsStyles,
      css`

        :host {
          box-sizing: border-box;
          -webkit-user-select: none; /* Safari */
          -moz-user-select: none;    /* Firefox */
          -ms-user-select: none;     /* Internet Explorer/Edge */
          user-select: none;      
        }

        .chip {
          box-sizing: border-box;
          display: inline-flex;
          border-radius: var(--wk-radius-full);
          align-items: center;
          justify-content: center;
          flex-direction: row;
          line-height: 1;
          white-space: nowrap;
          font-family: inherit;
          font-size: var(--wk-font-size-b3, 0.75rem);
          font-weight: var(--wk-font-weight-medium, 500);
        }

        .small {
          padding: var(--wk-space-1) var(--wk-space-4);
        }
        .medium {
          padding: var(--wk-space-2) var(--wk-space-4);
        }

        .filled.default {
          background: var(--wk-color-surface-raised);
        }
        .filled.success {
          background: var(--wk-color-action-subtle);
          color: var(--wk-color-action-on-subtle)
        }
        .filled.info {
          background: var(--wk-color-info-subtle);
          color: var(--wk-color-info-on-subtle)
        }
        .filled.error {
          background: var(--wk-color-danger-subtle);
          color: var(--wk-color-danger-on-subtle)
        }
        .filled.warning {
          background: var(--wk-color-warning-subtle);
          color: var(--wk-color-warning-on-subtle)
        }
        
        .outlined.default {
          border: 1px solid var(--wk-color-on-surface-muted-border);
        }
        .outlined.success {
          border: 1px solid var(--wk-color-action-border);
          color: var(--wk-color-action-subtle);
        }
        .outlined.info {
          border: 1px solid var(--wk-color-info-border);
          color: var(--wk-color-info-subtle);
        }
        .outlined.error {
          border: 1px solid var(--wk-color-danger-border);
          color: var(--wk-color-danger-subtle);
        }
        .outlined.warning {
          border: 1px solid var(--wk-color-warning-border);
          color: var(--wk-color-warning-subtle);
        }
        .clickeable{
          cursor: pointer;
        }

        .filled.default.clickeable:hover{
          background: var(--wk-color-surface-surface);
          box-shadow: inset 0 0 0 1px var(--wk-color-border); 
        }
        .filled.default.clickeable:active{
          background: var(--wk-color-surface-alt);
          box-shadow: inset 0 0 0 0px var(--wk-color-border); 
        }
        .filled.success.clickeable:hover{
          background: var(--wk-color-action-hover);
        }
        .filled.success.clickeable:active{
          background: var(--wk-color-action-active);
        }
        .filled.info.clickeable:hover{
          background: var(--wk-color-info-hover);
        }
        .filled.info.clickeable:active{
          background: var(--wk-color-info-active);
        }
        .filled.warning.clickeable:hover{
          background: var(--wk-color-warning-hover);
        }
        .filled.warning.clickeable:active{
          background: var(--wk-color-warning-active);
        }
        .filled.error.clickeable:hover{
          background: var(--wk-color-danger-hover);
        }
        .filled.error.clickeable:active{
          background: var(--wk-color-danger-active);
        }


        .outlined.default.clickeable:hover{
          background: var(--wk-color-surface-hover-border);
        }
        .outlined.default.clickeable:active{
          background: var(--wk-color-surface-border);
        }
        .outlined.success.clickeable:hover{
          background: var(--wk-color-action-hover-border);
          color: var(--wk-color-action-on-subtle);
        }
        .outlined.success.clickeable:active{
          background: var(--wk-color-action-active-border);
          color: var(--wk-color-action-on-subtle);
        }
        .outlined.info.clickeable:hover{
          background: var(--wk-color-info-hover-border);
          color: var(--wk-color-info-on-subtle);
        }
        .outlined.info.clickeable:active{
          background: var(--wk-color-info-active-border);
          color: var(--wk-color-info-on-subtle);
        }
        .outlined.warning.clickeable:hover{
          background: var(--wk-color-warning-hover-border);
          color: var(--wk-color-warning-on-subtle);
        }
        .outlined.warning.clickeable:active{
          background: var(--wk-color-warning-active-border);
          color: var(--wk-color-warning-on-subtle);
        }
        .outlined.error.clickeable:hover{
          background: var(--wk-color-danger-hover-border);
          color: var(--wk-color-danger-on-subtle);
        }
        .outlined.error.clickeable:active{
          background: var(--wk-color-danger-active-border);
          color: var(--wk-color-danger-on-subtle);
        }
      `
  ]

  @property() variant: string = 'filled';
  @property() color: string = 'default';
  @property() size: string = 'small';
  @property({ type: Boolean, reflect: true }) clickeable: boolean = false;

  private _onClick(): void {
    if(!this.clickeable) return;
    this.dispatchEvent(new CustomEvent('ui-click', { bubbles: true, composed: true }));
  }

  _getClassList() {
    const classList: any = {}
    switch(this.variant){
      case 'filled':
        classList['filled'] = true;
        break;
      case 'outlined':
        classList['outlined'] = true;
        break;
      default:
        classList['filled'] = true;
    }
    switch(this.color){
      case 'default':
        classList['default'] = true;
        break;
      case 'success':
        classList['success'] = true;
        break;
      case 'info':
        classList['info'] = true;
        break;
      case 'warning':
        classList['warning'] = true;
        break;
      case 'error':
        classList['error'] = true;
        break;
      default:
        classList['default'] = true;
    }
    switch(this.size){
      case 'small':
        classList['small'] = true;
        break;
      case 'medium':
        classList['medium'] = true;
        break;
      default:
        classList['small'] = true;
      
    }
    this.clickeable ? classList['clickeable'] = true: null;

    return classList;
  }


  override render() {
    return html`
      <div 
      class="chip ${classMap(this._getClassList())}"
      @click=${this._onClick}
      >
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
      'ui-chip': UiChip;
    }
}