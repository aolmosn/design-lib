import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from "../../styles/material-icons.styles";
import { classMap } from "lit/directives/class-map.js";
import { ButtonType } from "@design-lib/core";


@customElement('ui-button')
export class UiButton extends LitElement{
  static override styles = [
    defaultFontFamily,
    materialIconsStyles,
    css`

    :host {
      --btn-border-radius: 0.4rem;
      --btn-sm-height: 0.375rem;
      /* --btn-sm-height: 0.375rem 0.5rem; */
      --btn-md-height: 0.375rem 1.5rem;
      --btn-xl-height: 0.625rem 1rem;
      
      /* ── Primary ── */
      --btn-bg-color-primary-reposo:       var(--wk-color-action);
      --btn-bg-color-primary-hover:        var(--wk-color-action-hover);
      --btn-bg-color-primary-active:       var(--wk-color-action-active);
      --btn-bg-color-primary-disable:      var(--wk-color-border);
      --btn-text-color-primary-reposo:     var(--wk-color-action-on);
      --btn-text-color-primary-disable:    var(--wk-color-on-surface-disabled);
      --btn-border-color-primary-reposo:   var(--wk-color-action);
      --btn-border-color-primary-hover:    var(--wk-color-action-hover);
      --btn-border-color-primary-active:   var(--wk-color-action-active);
      --btn-border-color-primary-disabled: var(--wk-color-border);

      /* ── Secondary ── */
      --btn-bg-color-secondary-reposo:       transparent;
      --btn-bg-color-secondary-hover:        var(--wk-color-action-hover);
      --btn-bg-color-secondary-active:       var(--wk-color-action-active);
      --btn-border-color-secondary-reposo:   var(--wk-color-action);
      --btn-border-color-secondary-hover:    var(--wk-color-action-hover);
      --btn-border-color-secondary-active:   var(--wk-color-action-active);
      --btn-text-color-secondary-reposo:     var(--wk-white);
      --btn-bg-color-secondary-disabled:     var(--wk-color-surface);
      --btn-border-color-secondary-disabled: var(--wk-color-border);
      --btn-text-color-secondary-disabled:   var(--wk-color-on-surface-disabled);

      /* ── Tertiary ── */
      --btn-bg-color-tertiary-reposo:       var(--wk-color-surface);
      --btn-border-color-tertiary-reposo:   var(--wk-color-border-strong);
      --btn-text-color-tertiary-reposo:     var(--wk-color-on-surface-muted);
      --btn-bg-color-tertiary-hover:        var(--wk-color-surface-alt);
      --btn-border-color-tertiary-hover:    var(--wk-color-surface-alt);
      --btn-bg-color-tertiary-active:       var(--wk-color-border);
      --btn-border-color-tertiary-active:   var(--wk-color-border);
      --btn-bg-color-tertiary-disabled:     var(--wk-color-surface);
      --btn-border-color-tertiary-disabled: var(--wk-color-border);
      --btn-text-color-tertiary-disabled:   var(--wk-color-on-surface-disabled);

      /* ── Link ── */
      --btn-bg-color-link-reposo:       var(--wk-color-surface);
      --btn-border-color-link-reposo:   var(--wk-color-info);
      --btn-text-color-link-reposo:     var(--wk-color-info);
      --btn-bg-color-link-hover:        var(--wk-color-info-subtle);
      --btn-border-color-link-hover:    var(--wk-color-info);
      --btn-bg-color-link-active:       var(--wk-color-info-subtle);
      --btn-border-color-link-active:   var(--wk-color-info-subtle);
      --btn-bg-color-link-disabled:     var(--wk-color-surface);
      --btn-border-color-link-disabled: var(--wk-color-border);
      --btn-text-color-link-disabled:   var(--wk-color-on-surface-disabled);

     


      .btn {
        font-size:var(--wk-font-size-sm);
        font-weight: var(--wk-font-weight-semibold);
        line-height: var(--wk-font-line-height-b3);
        border-radius: var(--btn-border-radius);
        padding: var(--btn-sm-height);
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        /* width: 100%; */
        gap: 0.25rem;
      }

      

      .btn .icon {
        max-width: 24px;
        overflow: hidden;
        font-size:var(--wk-font-size-sm);
      }

      .btn.expanded {
        padding: var(--btn-xl-height);
        min-width: 104px;
      }
        
      .btn.primary {
        background-color: var(--btn-bg-color-primary-reposo);
        color: var(--btn-text-color-primary-reposo);
        border: 2px solid var(--btn-border-color-primary-reposo);
      }
       
      .btn.primary:hover {
        background-color: var(--btn-bg-color-primary-hover);
        border: 2px solid var(--btn-border-color-primary-hover);
      }
  
      .btn.primary:active {
        background-color: var(--btn-bg-color-primary-active);
        border: 2px solid var(--btn-border-color-primary-active);
      }
        
      .btn.secondary {
        background-color: var(--btn-bg-color-secondary-reposo);
        color: var(--btn-text-color-secondary-reposo);
        border: 2px solid var(--btn-border-color-secondary-reposo);
      }
        
      .btn.secondary:hover {
        background-color: var(--btn-bg-color-secondary-hover);
        border: 2px solid var(--btn-border-color-secondary-hover);
        
      }
  
      .btn.secondary:active {
        background-color: var(--btn-bg-color-secondary-active);
        border: 2px solid var(--btn-border-color-secondary-active);
      }

      .btn.tertiary {
        background-color: var(--btn-bg-color-tertiary-reposo);
        color: var(--btn-text-color-tertiary-reposo);
        border: 2px solid var(--btn-border-color-tertiary-reposo);
      }
        
      .btn.tertiary:hover {
        background-color: var(--btn-bg-color-tertiary-hover);
        border: 2px solid var(--btn-border-color-tertiary-hover);
        color: var(--btn-text-color-tertiary-reposo);
      }
  
      .btn.tertiary:active {
        background-color: var(--btn-bg-color-tertiary-active);
        border: 2px solid var(--btn-border-color-tertiary-active);
      }
      .btn.link {
        background-color: var(--btn-bg-color-link-reposo);
        color: var(--btn-text-color-link-reposo);
        border: 2px solid var(--btn-border-color-link-reposo);
      }
        
      .btn.link:hover {
        background-color: var(--btn-bg-color-link-hover);
        border: 2px solid var(--btn-border-color-link-hover);
        color: var(--btn-text-color-link-reposo);
      }
  
      .btn.link:active {
        background-color: var(--btn-bg-color-link-active);
        border: 2px solid var(--btn-border-color-link-active);
      }
    }


    
    :host([disabled]){
      
      .btn.primary[disabled] {
        background-color: var(--btn-bg-color-primary-disable);
        border: 2px solid var(--btn-border-color-primary-disabled);
        color: var(--btn-text-color-primary-disable);
        cursor: not-allowed;
      }

      .btn.secondary[disabled] {
        background-color: var(--btn-bg-color-secondary-disabled);
        border: 2px solid var(--btn-border-color-secondary-disabled);
        color: var(--btn-text-color-secondary-disabled);
        cursor: not-allowed;
      }

      .btn.tertiary[disabled] {
        background-color: var(--btn-bg-color-tertiary-disabled);
        border: 2px solid var(--btn-border-color-tertiary-disabled);
        color: var(--btn-text-color-tertiary-disabled);
        cursor: not-allowed;
      }
      .btn.link[disabled] {
        background-color: var(--btn-bg-color-link-disabled);
        border: 2px solid var(--btn-border-color-link-disabled);
        color: var(--btn-text-color-link-disabled);
        cursor: not-allowed;
      }
    }


    @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]) {
          --btn-border-radius: 1.5rem;
          --btn-md-height: 0.375rem 1.5rem;
          --btn-xl-height: 0.625rem 1rem;
          
          --btn-bg-color-primary-reposo: var(--wk-color-action);
          --btn-bg-color-primary-hover: var(--wk-color-action-hover);
          --btn-bg-color-primary-active: var(--wk-color-action-active);
          --btn-bg-color-primary-disable: var(--wk-color-surface);
          --btn-text-color-primary-reposo: var(--wk-white);
          --btn-text-color-primary-disable: var(--wk-color-on-surface-disabled);
          --btn-border-color-primary-reposo: var(--wk-green-500);
          --btn-border-color-primary-hover: var(--wk-green-400);
          --btn-border-color-primary-active: var(--wk-green-300);
          --btn-border-color-primary-disabled: var(--wk-gray-200);


          --btn-bg-color-secondary-reposo: transparent;
          --btn-bg-color-secondary-hover: var(--wk-green-100);
          --btn-bg-color-secondary-active: var(--wk-green-200);
          --btn-border-color-secondary-reposo: var(--wk-white);
          --btn-border-color-secondary-hover: var(--wk-green-100);
          --btn-border-color-secondary-active: var(--wk-green-200);
          --btn-text-color-secondary-reposo: var(--wk-green-500);
          --btn-bg-color-secondary-disabled: var(--wk-color-surface);
          --btn-border-color-secondary-disabled: var(--wk-gray-200);
          --btn-text-color-secondary-disabled: var(--wk-gray-300);

          --btn-bg-color-tertiary-reposo: var(--wk-color-surface);
          --btn-border-color-tertiary-reposo: var(--wk-gray-400);
          --btn-text-color-tertiary-reposo: var(--wk-gray-400);
          --btn-bg-color-tertiary-hover: var(--wk-gray-100);
          --btn-border-color-tertiary-hover: var(--wk-gray-100);
          --btn-bg-color-tertiary-active: var(--wk-gray-200);
          --btn-border-color-tertiary-active: var(--wk-gray-200);
          --btn-bg-color-tertiary-disabled: var(--wk-color-surface);
          --btn-border-color-tertiary-disabled: var(--wk-gray-200);
          --btn-text-color-tertiary-disabled: var(--wk-gray-300);

          --btn-bg-color-link-reposo: var(--wk-color-surface);
          --btn-border-color-link-reposo: var(--wk-blue-500);
          --btn-text-color-link-reposo: var(--wk-blue-500);
          --btn-bg-color-link-hover: var(--wk-blue-100);
          --btn-border-color-link-hover: var(--wk-blue-500);
          --btn-text-color-link-reposo: var(--wk-blue-500);
          --btn-bg-color-link-active: var(--wk-blue-200);
          --btn-border-color-link-active: var(--wk-blue-200);
          --btn-bg-color-link-disabled: var(--wk-color-surface);
          --btn-border-color-link-disabled: var(--wk-gray-200);
          --btn-text-color-link-disabled: var(--wk-gray-300);
        }
      }
      :root[data-theme="dark"] {
        --btn-border-radius: 1.5rem;
        --btn-md-height: 0.375rem 1.5rem;
        --btn-xl-height: 0.625rem 1rem;
        
        --btn-bg-color-primary-reposo: var(--wk-color-action);
        --btn-bg-color-primary-hover: var(--wk-color-action-hover);
        --btn-bg-color-primary-active: var(--wk-color-action-active);
        --btn-bg-color-primary-disable: var(--wk-color-surface);
        --btn-text-color-primary-reposo: var(--wk-white);
        --btn-text-color-primary-disable: var(--wk-color-on-surface-disabled);
        --btn-border-color-primary-reposo: var(--wk-green-500);
        --btn-border-color-primary-hover: var(--wk-green-400);
        --btn-border-color-primary-active: var(--wk-green-300);
        --btn-border-color-primary-disabled: var(--wk-gray-200);


        --btn-bg-color-secondary-reposo: transparent;
        --btn-bg-color-secondary-hover: var(--wk-green-100);
        --btn-bg-color-secondary-active: var(--wk-green-200);
        --btn-border-color-secondary-reposo: var(--wk-white);
        --btn-border-color-secondary-hover: var(--wk-green-100);
        --btn-border-color-secondary-active: var(--wk-green-200);
        --btn-text-color-secondary-reposo: var(--wk-green-500);
        --btn-bg-color-secondary-disabled: var(--wk-color-surface);
        --btn-border-color-secondary-disabled: var(--wk-gray-200);
        --btn-text-color-secondary-disabled: var(--wk-gray-300);

        --btn-bg-color-tertiary-reposo: var(--wk-color-surface);
        --btn-border-color-tertiary-reposo: var(--wk-gray-400);
        --btn-text-color-tertiary-reposo: var(--wk-gray-400);
        --btn-bg-color-tertiary-hover: var(--wk-gray-100);
        --btn-border-color-tertiary-hover: var(--wk-gray-100);
        --btn-bg-color-tertiary-active: var(--wk-gray-200);
        --btn-border-color-tertiary-active: var(--wk-gray-200);
        --btn-bg-color-tertiary-disabled: var(--wk-color-surface);
        --btn-border-color-tertiary-disabled: var(--wk-gray-200);
        --btn-text-color-tertiary-disabled: var(--wk-gray-300);

        --btn-bg-color-link-reposo: var(--wk-color-surface);
        --btn-border-color-link-reposo: var(--wk-blue-500);
        --btn-text-color-link-reposo: var(--wk-blue-500);
        --btn-bg-color-link-hover: var(--wk-blue-100);
        --btn-border-color-link-hover: var(--wk-blue-500);
        --btn-text-color-link-reposo: var(--wk-blue-500);
        --btn-bg-color-link-active: var(--wk-blue-200);
        --btn-border-color-link-active: var(--wk-blue-200);
        --btn-bg-color-link-disabled: var(--wk-color-surface);
        --btn-border-color-link-disabled: var(--wk-gray-200);
        --btn-text-color-link-disabled: var(--wk-gray-300);
      }


    
    `
  ]

  @property()                                 type: ButtonType         = 'PRIMARY';
  @property()                                 rigthIcon: string        = '';
  @property()                                 leftIcon: string         = '';
  @property({ type: Boolean, reflect: true }) expanded                 = false;
  @property({ type: Boolean, reflect: true }) disabled                 = false;

  private _onClick(): void {
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent('ui-click', { bubbles: true, composed: true }));
  }

  private get _buttonClasses() {
    return {
        'primary': this.type === 'PRIMARY',
        'secondary': this.type === 'SECONDARY',
        'tertiary': this.type === 'TERTIARY',
        'link': this.type === 'LINK',
        'quinary': this.type === 'QUINARY',
        'expanded': this.expanded === true
    };
  }
  override render() {
    return html`
      <button
        class="btn ${classMap(this._buttonClasses)}"
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        ${this.leftIcon  ? html`<i class="material-icons icon left-icon" aria-hidden="true">${this.leftIcon}</i>`: ''}
        
        
        <slot></slot>
        ${ this.rigthIcon ? html`<i class="material-icons icon right-icon" aria-hidden="true">${this.rigthIcon}</i>`: ''}
        
      </button>
    `
  }

}


declare global {
  interface HTMLElementTagNameMap {
    'ui-button': UiButton;
  }
}