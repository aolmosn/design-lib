import { css, html, LitElement } from "lit";
import { defaultFontFamily } from "../../styles/default-font.styles";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";


@customElement('ui-radio-button')
export class UiRadioButton extends LitElement {
  static override styles = [
    defaultFontFamily,
    css`
      :host {
        display: inline-block;
      }

      .container {
        display: flex;
        flex-direction: row;
        margin: 10px;
      }

      .label {
        cursor: pointer;
      }

      input[type="radio"] {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }

      .radio-circle {
        cursor: pointer;
        height: 20px;
        width: 20px;
        border: 2px solid #ccc;
        border-radius: 50%;
        display: inline-block;
        position: relative;
        transition: all 0.2s ease-in-out;
        margin-right: 8px;
      }

      .radio-circle::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 0px;
        height: 0px;
        border-radius: 50%;
        background: #E2E8EA;
        transition: width 0.3s ease-in-out, height 0.3s ease-in-out, opacity 0.6s ease-in-out;
        opacity: 1;
      }

      .radio-circle::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #007bff;
        transition: opacity 0.2s ease-in-out;
        opacity: 0;
      }

      input[type="radio"]:checked + .radio-circle {
        border-color: #007bff; // Cambia el color del borde exterior
      }

      input[type="radio"]:checked + .radio-circle::before {
        width: 40px;
        height: 40px;
        opacity: 0;
      }

      input[type="radio"]:checked + .radio-circle::after {
        opacity: 1;
      }

      .container.disabled {
        cursor: not-allowed;
        color: #999;
      }

      .container.disabled .radio-circle {
        cursor: not-allowed;
        border-color: #e0e0e0;
        background-color: #f5f5f5;

      }
      .container.disabled .radio-circle::after {
        background: #b0b0b0; // El punto central se vuelve gris si estaba seleccionado
      }
      
      // Extra: Efecto Hover (solo si no está desactivado)
      &:not(.disabled):hover .radio-circle {
        border-color: #0056b3;
      }

      input[type="radio"]:disabled,
      input[type="radio"]:disabled + .radio-circle + .label,
      input[type="radio"]:disabled + .radio-circle
      {
        cursor: not-allowed;
        opacity: 0.6; /* Opcional: baja la opacidad para reforzar que está apagado */
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) checked  = false;
  @property()                                 label    = '';
  @property()                                 name     = '';
  @property()                                 value    = 'on';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;

  private _onNativeChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;
    this.dispatchEvent(new CustomEvent<RadioButtonChangeDetail>('ui-change', {
      bubbles: true,
      composed: true,
      detail: { checked: input.checked, value: input.value },
    }));
  }

  private _onNativeBlur(): void {
    this.dispatchEvent(new CustomEvent('ui-blur', { bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <label class="container" part="container">
        <input
          class="input"
          part="input"
          type="radio"
          name=${ifDefined(this.name || undefined)}
          .value=${this.value}
          .checked=${this.checked}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-required=${this.required ? 'true' : 'false'}
          @change=${this._onNativeChange}
          @blur=${this._onNativeBlur}
        />
        <span class="radio-circle"></span>
        <span class="label">${this.label}</span>
      </label>
    `;
  }
}

export interface RadioButtonChangeDetail {
  checked: boolean;
  value: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-radio-button': UiRadioButton;
  }
}