import { CSSResultGroup, html, LitElement, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from "../../styles/material-icons.styles";
import { ElementPositioner } from '../../utils/element-positioner';

@customElement('ui-kebab-container')
export class UiKebabContainer extends LitElement {

  static override styles?: CSSResultGroup | undefined = [
    defaultFontFamily,
    materialIconsStyles,
    css`
      :host{
        display: block;
        .kebab-button{
          cursor: pointer;
          -webkit-user-select: none; /* Safari y Chrome antiguos */
          -moz-user-select: none;    /* Firefox antiguo */
          -ms-user-select: none;     /* Internet Explorer / Edge antiguo */
          user-select: none;         /* Propiedad estándar y moderna */
        }

        .kebab-list{
          width: max-content;
          z-index: 1000;
          margin: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          background-color: var(--wk-color-surface-raised);
          border-radius: var(--wk-radius-md);
          padding: var(--wk-space-4) 0px;
          min-width: 200px;
          box-shadow: var(--wk-shadow-120);
        }

        .kebab-list[hidden] {
          display: none;
        }
        
      }

    `
  ]

  @property({ type: Boolean }) hideList: boolean = true;
  triggerElement: Element | null = null;
  private _positioner: ElementPositioner | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('ui-select', () => this.hide());
  }

  setTrigger(triggerEl: any) {
    this.triggerElement = triggerEl;
  }

  async show() {
    this.hideList = false;
    await this.updateComplete;

    const triggerEl = this.triggerElement ?? this.renderRoot.querySelector('.kebab-button') as Element;
    const menuEl    = this.renderRoot.querySelector('.kebab-list') as HTMLElement;

    this._positioner = new ElementPositioner(triggerEl, menuEl, {gap:4});
    this._positioner.start();

    document.addEventListener('click', this._handleoutsideClick, true);
  }

  hide() {
    this.hideList = true;
    this._positioner?.stop();
    this._positioner = null;
    document.removeEventListener('click', this._handleoutsideClick, true);
  }

  toggle() {
    this.hideList ? this.show() : this.hide();
  }

  _handleoutsideClick = (e: any) => {
    const path = e.composedPath(); // Importante para atravesar shadow dom
    if( !path.includes(this.triggerElement) && !path.includes(this)) {
      this.hide();
    }
  }



  override render(){
    return html`
      ${  this.triggerElement? 
        null : 
        html`
          <i 
          class="material-icons kebab-button" 
          @click="${this.toggle}"
          >more_vert</i>
        ` }

      <ul class="kebab-list" ?hidden="${this.hideList}">
        <slot></slot>
      </ul>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-kebab-container': UiKebabContainer;
  }
}