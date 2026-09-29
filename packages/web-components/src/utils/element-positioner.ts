import { ResponsiveController } from './responsive.controller';

export interface PositionOptions {
  gap?: number;
}

export interface PositionPlacement {
  vertical: 'top' | 'bottom';
  horizontal: 'start' | 'end';
}

export class ElementPositioner {
  private _resizeObserver: ResizeObserver | null = null;
  private _scrollHandler: (() => void) | null = null;

  constructor(
    private triggerEl: Element,
    private floatEl: HTMLElement,
    private options: PositionOptions = {},
  ) {}

  start(): void {
    this.update();

    this._resizeObserver = new ResizeObserver(() => this.update());
    this._resizeObserver.observe(this.triggerEl);

    this._scrollHandler = () => this.update();
    window.addEventListener('scroll', this._scrollHandler, true);
    window.addEventListener('resize', this._scrollHandler);
  }

  update(): PositionPlacement {
    const triggerRect = this.triggerEl.getBoundingClientRect();
    const floatRect   = this.floatEl.getBoundingClientRect();
    const gap         = this.options.gap ?? 4;

    // Eje vertical: preferir abajo, caer a arriba si no hay espacio
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    let top: number;
    let verticalPlacement: 'top' | 'bottom';

    if (spaceBelow >= floatRect.height || spaceBelow >= spaceAbove) {
      top              = triggerRect.bottom + gap;
      verticalPlacement = 'bottom';
    } else {
      top              = triggerRect.top - floatRect.height - gap;
      verticalPlacement = 'top';
    }

    // si quiero que quede visible en el top y siga el scroll
    //if (top < 0) top = gap;

    // Eje horizontal: alinear a la derecha del trigger, caer a la izquierda si se sale
    let left: number;
    let horizontalPlacement: 'start' | 'end';

    left               = triggerRect.right - floatRect.width;
    horizontalPlacement = 'end';

    if (left < gap) {
      left               = triggerRect.left;
      horizontalPlacement = 'start';
    }

    Object.assign(this.floatEl.style, {
      position: 'fixed',
      top:  `${top}px`,
      left: `${left}px`,
    });

    const placement: PositionPlacement = {
      vertical:   verticalPlacement,
      horizontal: horizontalPlacement,
    };

    this.floatEl.setAttribute('data-placement-v', placement.vertical);
    this.floatEl.setAttribute('data-placement-h', placement.horizontal);

    return placement;
  }

  stop(): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler, true);
      window.removeEventListener('resize', this._scrollHandler);
      this._scrollHandler = null;
    }
  }
}
