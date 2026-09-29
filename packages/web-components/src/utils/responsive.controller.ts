import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type ResponsiveSize = 'sm' | 'md' | 'lg';

export interface ResponsiveBreakpoints {
  /** Ancho máximo (px) para considerar "sm". Por defecto 600. */
  sm?: number;
  /** Ancho máximo (px) para considerar "md". Por defecto 960. */
  md?: number;
}

/**
 * Reactive Controller que observa el ancho del host y asigna
 * data-size="sm|md|lg" para usar en CSS con selectores de atributo.
 *
 * Uso en componente:
 *   private _responsive = new ResponsiveController(this);
 *   // En CSS: :host([data-size="sm"]) .mi-clase { flex-direction: column; }
 */
export class ResponsiveController implements ReactiveController {
  private _observer: ResizeObserver | null = null;
  private _host: ReactiveControllerHost & Element;
  private _sm: number;
  private _md: number;

  size: ResponsiveSize = 'lg';

  constructor(
    host: ReactiveControllerHost & Element,
    breakpoints: ResponsiveBreakpoints = {},
  ) {
    this._host = host;
    this._sm   = breakpoints.sm ?? 600;
    this._md   = breakpoints.md ?? 960;
    host.addController(this);
  }

  hostConnected(): void {
    this._observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      this._update(width);
    });
    this._observer.observe(this._host);
  }

  hostDisconnected(): void {
    this._observer?.disconnect();
    this._observer = null;
  }

  private _update(width: number): void {
    const next: ResponsiveSize =
      width <= this._sm ? 'sm' :
      width <= this._md ? 'md' :
      'lg';

    if (next !== this.size) {
      this.size = next;
      this._host.setAttribute('data-size', next);
      this._host.requestUpdate();
    }
  }
}
