import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from "../../styles/material-icons.styles";

export interface CheckBoxChangeDetail {
  checked: boolean;
  value: string;
}

@customElement('ui-check-box')
export class UiCheckBox extends LitElement {
  static override styles = [
    defaultFontFamily,
    materialIconsStyles,
    css`
      :host {
        display: inline-block;
      }

      .container {
        display: inline-flex;
        align-items: center;
        gap: var(--wk-space-2, 8px);
        cursor: pointer;
      }

      input[type="checkbox"] {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }

      .container .check-box {
        width: 18px;
        height: 18px;
        border: 2px solid var(--wk-gray-300);
        background: var(--wk-color-surface-alt);
        border-radius: var(--wk-radius-sm);
        position:relative;
      }

      .container .check-box::after {
        font-family: 'Material Icons', sans serif;
        content: '\\e876';
        font-size: 18px;
        background-color: var(--wk-blue-500);
        color: var(--wk-white);
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }
      .container.indeterminado .check-box {
        border: 2px solid var(--wk-blue-500);
      }

      .container.indeterminado .check-box::after {
        font-family: 'Material Icons', sans serif;
        content: '\\e15b';
        font-size: 18px;
        background-color: var(--wk-blue-500);
        color: var(--wk-white);
        opacity: 1;
        transition: opacity 0.2s ease-in-out;
      }
        
      .container .check-box::before {
        content: '';
        background-color: var(--wk-gray-200);
        color: var(--wk-white);
        display: block;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        opacity: 1;
        width: 0px;
        height: 0px;
        border-radius: var(--wk-radius-sm);
        transition: width 0.3s ease-in-out, height 0.3s ease-in-out, border-radius 0.3s ease-in-out, opacity 0.6s ease-in-out;
      }

      .container input[type="checkbox"]:checked + .check-box {
        border: 2px solid var(--wk-blue-500);
      }

      .container input[type="checkbox"]:checked + .check-box::after {
        opacity: 1;
      }
      .container input[type="checkbox"]:checked + .check-box::before {
        width: 40px;
        height: 40px;
        opacity: 0;
        border-radius: var(--wk-radius-xl);
      }

      :host([disabled]) {
        .container {
          cursor: not-allowed; 
        }

        .label-text {
          color: var(--wk-color-on-surface-disabled, #111827);
        }


        .input {
          border: 1px solid var(--wk-color-on-surface-disabled, #d1d5db);
        }

        .container input[type="checkbox"]:checked + .check-box {
          border: 2px solid var(--wk-color-on-surface-disabled);
        }

        .container .check-box {
          border: 2px solid var(--wk-color-on-surface-disabled);
        }

        .container.indeterminado .check-box::after {
          background-color: var(--wk-color-on-surface-disabled);
        }
        
        .container .check-box::after {
          background-color: var(--wk-color-on-surface-disabled);

        }

      }
      


      .input {
        width: 1rem;
        height: 1rem;
        cursor: inherit;
        flex-shrink: 0;
        accent-color: var(--ui-color-primary, #2563eb);
        border: 1px solid var(--ui-color-border, #d1d5db);
        border-radius: var(--ui-radius-sm, 4px);
      }

      .label-text {
        font-size: var(--ui-font-size-sm, 0.875rem);
        font-weight: var(--ui-font-weight-normal, 400);
        color: var(--wk-color-on-surface-muted, #111827);
        line-height: var(--ui-line-height-normal, 1.5);
        user-select: none;
      }

      .label-text--required::after {
        content: ' *';
        color: var(--ui-color-error, #dc2626);
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) checked       = false;
  @property()                                 label         = '';
  @property()                                 name          = '';
  @property()                                 value         = 'on';
  @property({ type: Boolean, reflect: true }) disabled      = false;
  @property({ type: Boolean, reflect: true }) required      = false;
  @property({ type: Boolean, reflect: true }) indeterminado = false;

  private _onNativeChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.indeterminado = false;
    this.checked = input.checked;
    this.dispatchEvent(
      new CustomEvent<CheckBoxChangeDetail>('ui-change', {
        detail: { checked: this.checked, value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onNativeBlur(): void {
    this.dispatchEvent(new CustomEvent('ui-blur', { bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <label class="container${this.indeterminado ? ' indeterminado' : ''}" part="container">
        <input
          class="input"
          part="input"
          type="checkbox"
          name=${ifDefined(this.name || undefined)}
          .value=${this.value}
          .checked=${this.checked}
          .indeterminate=${this.indeterminado}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-required=${this.required ? 'true' : 'false'}
          aria-checked=${this.indeterminado ? 'mixed' : this.checked ? 'true' : 'false'}
          @change=${this._onNativeChange}
          @blur=${this._onNativeBlur}
        >
        <span class="check-box"></span>
        ${this.label
          ? html`<span class="label-text${this.required ? ' label-text--required' : ''}" part="label">
              ${this.label}
            </span>`
          : html`<slot></slot>`
        }
        
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-check-box': UiCheckBox;
  }
}
