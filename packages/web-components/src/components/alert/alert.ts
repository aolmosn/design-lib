import { generateId, DEFAULT_ALERT_ICONS } from "@design-lib/core";
import type { AlertType } from "@design-lib/core";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { materialIconsStyles } from "../../styles/material-icons.styles";
import { defaultFontFamily } from './../../styles/default-font.styles';

@customElement('ui-alert')
export class UiAlert extends LitElement {
    static override styles = [
        defaultFontFamily,
        materialIconsStyles,
        css`
            :host {
                .alert-container {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.5rem;
                }

                .alert-container.background {
                    padding: 1rem;
                    border-radius: var(--wk-radius-md);
                }

                /* ── Info ── */
                .alert-container.alert-container--info .material-icons {
                    color: var(--wk-color-info);
                }
                .alert-container.background.alert-container--info {
                    background: var(--wk-color-info-subtle);
                }
                .alert-container.background.alert-container--info .material-icons {
                    color: var(--wk-color-info-on-subtle);
                }

                /* ── Success ── */
                .alert-container.alert-container--success .material-icons {
                    color: var(--wk-color-action);
                }
                .alert-container.background.alert-container--success {
                    background: var(--wk-color-action-subtle);
                }
                .alert-container.background.alert-container--success .material-icons {
                    color: var(--wk-color-action-on-subtle);
                }

                /* ── Warning ── */
                .alert-container.alert-container--warning .material-icons {
                    color: var(--wk-color-warning);
                }
                .alert-container.background.alert-container--warning {
                    background: var(--wk-color-warning-subtle);
                }
                .alert-container.background.alert-container--warning .material-icons {
                    color: var(--wk-color-warning-on-subtle);
                }

                /* ── Error ── */
                .alert-container.alert-container--error .material-icons {
                    color: var(--wk-color-danger);
                }
                .alert-container.background.alert-container--error {
                    background: var(--wk-color-danger-subtle);
                }
                .alert-container.background.alert-container--error .material-icons {
                    color: var(--wk-color-danger-on-subtle);
                }
            }
        `
    ];

    // ── Propiedades públicas ─────────────────────────────────────────
    @property() type: AlertType = 'INFO';
    @property({ type: Boolean, attribute: 'no-background' }) noBackground = false;
    @property() content = '';
    /** Permite sobreescribir el ícono de una o más variantes sin forkear la librería */
    @property({ attribute: false }) icons: Partial<Record<AlertType, string>> = {};

    // ── IDs para accesibilidad (generados una sola vez) ──────────────
    private readonly _alertId  = generateId('ui-input');

    // ── Getters de apoyo ─────────────────────────────────────────────

    private get _icon() {
        return this.icons[this.type] ?? DEFAULT_ALERT_ICONS[this.type] ?? '';
    }

    /** ERROR/WARNING interrumpen al lector de pantalla; INFO/SUCCESS esperan su turno */
    private get _isUrgent() {
        return this.type === 'ERROR' || this.type === 'WARNING';
    }

    private get _role() {
        return this._isUrgent ? 'alert' : 'status';
    }

    private get _ariaLive() {
        return this._isUrgent ? 'assertive' : 'polite';
    }

    private get _inputClasses() {
        return {
            'alert-container': true,
            'alert-container--info': this.type === 'INFO',
            'alert-container--warning': this.type === 'WARNING',
            'alert-container--success': this.type === 'SUCCESS',
            'alert-container--error': this.type === 'ERROR',
            'background': !this.noBackground,
            
        };
    }

    // ── Render ───────────────────────────────────────────────────────

    override render() {
        return html`
            <div
                class="${classMap(this._inputClasses)}"
                part="alert-container"
                role="${this._role}"
                aria-live="${this._ariaLive}"
                aria-atomic="true"
            >
                <div>
                    <i class="material-icons" aria-hidden="true">${this._icon}</i>
                </div>
                <div>
                    <slot>${this.content}</slot>
                </div>
            </div>
        `
    }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-alert': UiAlert;
  }
}