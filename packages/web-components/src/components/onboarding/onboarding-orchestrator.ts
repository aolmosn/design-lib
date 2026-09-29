import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import './onboarding-background';
import './onboarding-coachmark';
import type { UiOnboardingBackground } from './onboarding-background';
import type { UiOnboardingCoachmark }  from './onboarding-coachmark';

export interface OnboardingStep {
  selector:    string;
  title:       string;
  description: string;
}

@customElement('ui-onboarding')
export class UiOnboarding extends LitElement {

  @property({ type: Array }) steps: OnboardingStep[] = [];

  @query('ui-onboarding-background') private _background!: UiOnboardingBackground;
  @query('ui-onboarding-coachmark')  private _coachmark!: UiOnboardingCoachmark;

  private _currentIndex = 0;

  // ── API pública ────────────────────────────────────────────────────

  start(): void {
    this._currentIndex = 0;
    this._showStep(0);
  }

  stop(): void {
    this._background.clear();
    this._coachmark.hide();
    this._dispatch('ui-onboarding-close');
  }

  next(): void {
    if (this._currentIndex < this.steps.length - 1) {
      this._currentIndex++;
      this._showStep(this._currentIndex);
    } else {
      this.stop();
      this._dispatch('ui-onboarding-finish');
    }
  }

  prev(): void {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this._showStep(this._currentIndex);
    }
  }

  // ── Lógica interna ─────────────────────────────────────────────────

  private _showStep(index: number): void {
    const step    = this.steps[index];
    const element = document.querySelector(step.selector);

    if (!element) {
      console.warn(`[ui-onboarding] selector no encontrado: "${step.selector}"`);
      return;
    }

    this._background.focusOn(element);

    this._coachmark.heading     = step.title;
    this._coachmark.description = step.description;
    this._coachmark.currentStep = index + 1;
    this._coachmark.totalSteps  = this.steps.length;
    this._coachmark.showAt(element);

    this._dispatch('ui-onboarding-step', { step, index });
  }

  private _dispatch(name: string, detail: object = {}): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  override firstUpdated(): void {
    // Escuchar eventos del coachmark para delegarlos al método correcto
    this._coachmark.addEventListener('ui-prev',   () => this.prev());
    this._coachmark.addEventListener('ui-next',   () => this.next());
    this._coachmark.addEventListener('ui-finish', () => this.stop());
  }

  override render() {
    return html`
      <ui-onboarding-background></ui-onboarding-background>
      <ui-onboarding-coachmark></ui-onboarding-coachmark>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-onboarding': UiOnboarding;
  }
}
