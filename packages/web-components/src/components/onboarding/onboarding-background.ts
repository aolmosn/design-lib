import { CSSResultGroup, css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { defaultFontFamily } from '../../styles/default-font.styles';

@customElement('ui-onboarding-background')
export class UiOnboardingBackground extends LitElement {
  static override styles?: CSSResultGroup = [
    defaultFontFamily,
    css`
      :host {
        .spotlight {
          position: fixed;
          pointer-events: none;
          box-shadow: 0 0 0 9999px var(--wk-color-surface-overlay);
          border-radius: 6px;
          z-index: 1000;
          transition: top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease;
        }

        .spotlight[hidden] {
          display: none;
        }
      }
    `,
  ];

  @property({ type: Boolean }) active = false;

  private _spotlightEl: HTMLElement | null = null;
  private _scrollHandler: (() => void) | null = null;
  private _currentTarget: Element | null = null;
  private _scrollEndTimer: ReturnType<typeof setTimeout> | null = null;

  focusOn(element: Element): void {
    this._currentTarget = element;
    this._cleanListeners();
    this._elementIntoScreen(element);
    this.active = true;
    this.updateComplete.then(() => {
      if (!this._spotlightEl) {
        this._spotlightEl = this.renderRoot.querySelector('.spotlight') as HTMLElement;
      }
      // Sin transición en la primera aparición para evitar que vuele desde (0,0)
      if (!this._spotlightEl.style.top) {
        this._spotlightEl.style.transition = 'none';
        this._positionOver(element);
        requestAnimationFrame(() => {
          this._spotlightEl!.style.transition = '';
        });
      } else {
        this._positionOver(element);
      }
    });

    this._scrollHandler = () => {
      if (!this._currentTarget || !this._spotlightEl) return;
      // Deshabilitar transición mientras se hace scroll para seguir sin desfase
      this._spotlightEl.style.transition = 'none';
      this._positionOver(this._currentTarget);
      // Reactivar transición cuando el scroll se detiene
      if (this._scrollEndTimer !== null) clearTimeout(this._scrollEndTimer);
      this._scrollEndTimer = setTimeout(() => {
        if (this._spotlightEl) this._spotlightEl.style.transition = '';
        this._scrollEndTimer = null;
      }, 150);
    };
    window.addEventListener('scroll', this._scrollHandler, true);
    window.addEventListener('resize', this._scrollHandler);
  }

  clear(): void {
    this._cleanListeners();
    if (this._scrollEndTimer !== null) {
      clearTimeout(this._scrollEndTimer);
      this._scrollEndTimer = null;
    }
    this._currentTarget = null;
    this.active = false;
  }

  private _positionOver(element: Element): void {
    if (!this._spotlightEl) return;
    const padding = 6;
    const rect    = element.getBoundingClientRect();

    Object.assign(this._spotlightEl.style, {
      top:    `${rect.top    - padding}px`,
      left:   `${rect.left   - padding}px`,
      width:  `${rect.width  + padding * 2}px`,
      height: `${rect.height + padding * 2}px`,
    });


  }

  private _elementIntoScreen(element: Element){

    const rect    = element.getBoundingClientRect();
    const gap     = 10;

    console.log(rect)

    let scrollVertical = window.scrollY;   // Píxeles desplazados hacia abajo
    let scrollHorizontal = window.scrollX;

    console.log(`Scroll vertical: ${scrollVertical}px`);
    console.log(`Scroll horizontal: ${scrollHorizontal}px`);

    if ( rect.top < 0) {
      scrollVertical =scrollVertical+rect.y - gap;
    }

    if (rect.left < 0 ) {
      scrollHorizontal =scrollHorizontal+rect.x - gap;
    }

    console.log(`nuevo Scroll vertical: ${scrollVertical}px`);
    console.log(`nuevo Scroll horizontal: ${scrollHorizontal}px`);

    window.scrollTo({
      top: scrollVertical,
      left: scrollHorizontal,
      behavior: 'smooth'
    });

  
  }

  private _cleanListeners(): void {
    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler, true);
      window.removeEventListener('resize', this._scrollHandler);
      this._scrollHandler = null;
    }
  }

  override render() {
    return html`<div class="spotlight" ?hidden=${!this.active}></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-onboarding-background': UiOnboardingBackground;
  }
}
