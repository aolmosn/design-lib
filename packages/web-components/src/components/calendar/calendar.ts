import { css, CSSResultGroup, html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from '../../styles/material-icons.styles';
import { DayCell, sameDay, localDate, parseISO, toISO, isWeekend, nthBusinessDay } from './calendar-utils';
import '../button/button';

type Mode = 'single' | 'range';

// ── Component ─────────────────────────────────────────────────────────────────

@customElement('ui-calendar')
export class UiCalendar extends LitElement {
  static override styles?: CSSResultGroup = [
    defaultFontFamily,
    materialIconsStyles,
    css`
      :host {
        display: inline-block;
        box-sizing: border-box;
        font-family: var(--wk-font-family);
      }

      .calendar {
        background: var(--wk-color-surface-raised);
        border: 1px solid var(--wk-color-border);
        border-radius: var(--wk-radius-lg);
        padding: var(--wk-space-4);
        width: 288px;
        box-sizing: border-box;
        user-select: none;
      }

      /* ── Selection labels ──────────────────────────────────────────── */

      .selection-info {
        display: flex;
        align-items: stretch;
        gap: var(--wk-space-2);
        margin-bottom: var(--wk-space-4);
      }

      .date-label {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--wk-space-2) var(--wk-space-3);
        border-radius: var(--wk-radius-sm);
        border: 1px solid var(--wk-color-border);
        background: var(--wk-color-surface);
        transition: border-color 0.2s ease, background-color 0.2s ease;
        min-width: 0;
        cursor: pointer;

        &:hover {
          border-color: var(--wk-color-border-strong);
          background: var(--wk-color-surface-raised);
        }

        &.active {
          border-color: var(--wk-color-action);
          background: var(--wk-color-action-subtle);
          cursor: default;

          .date-label__title { color: var(--wk-color-action-on-subtle); }
        }
      }

      .date-label__title {
        font-size: 0.65rem;
        font-weight: var(--wk-font-weight-medium);
        color: var(--wk-color-on-surface-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .date-label__value {
        font-size: var(--wk-font-size-b3);
        font-weight: var(--wk-font-weight-semibold);
        color: var(--wk-color-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .date-label__placeholder {
        font-size: var(--wk-font-size-b3);
        color: var(--wk-color-on-surface-muted);
      }

      .date-sep {
        display: flex;
        align-items: center;
        color: var(--wk-color-on-surface-muted);
        font-size: var(--wk-font-size-b3);
        flex-shrink: 0;
      }

      /* ── Header ────────────────────────────────────────────────────── */

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--wk-space-4);
      }

      .header-label {
        font-size: var(--wk-font-size-b2);
        font-weight: var(--wk-font-weight-semibold);
        color: var(--wk-color-on-surface);
        text-transform: capitalize;
      }

      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: var(--wk-radius-sm);
        border: none;
        background: transparent;
        color: var(--wk-color-on-surface-muted);
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:hover {
          background: var(--wk-color-surface);
          color: var(--wk-color-on-surface);
        }

        &:disabled {
          opacity: 0.25;
          cursor: default;
          &:hover { background: transparent; }
        }

        .material-icons { font-size: 1.1rem; }
      }

      /* ── Week headers ──────────────────────────────────────────────── */

      .week-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        margin-bottom: var(--wk-space-1);
      }

      .week-day-header {
        text-align: center;
        font-size: var(--wk-font-size-b3);
        font-weight: var(--wk-font-weight-medium);
        color: var(--wk-color-on-surface-muted);
        padding: var(--wk-space-1) 0;
      }

      /* ── Day grid ──────────────────────────────────────────────────── */

      .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }

      .sr-only {
        position: absolute;
        width: 1px; height: 1px;
        padding: 0; margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .inline-tip {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        background: var(--wk-color-surface-inverse, #1f2328);
        color: var(--wk-color-on-surface-inverse, #f0f6fc);
        font-family: var(--wk-font-family);
        font-size: var(--wk-font-size-b3, 0.75rem);
        line-height: 1.4;
        padding: 4px 8px;
        border-radius: var(--wk-radius-sm, 4px);
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);
        transform: translateX(-50%) translateY(-100%);

        &::after {
          content: '';
          position: absolute;
          top: 100%; left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: var(--wk-color-surface-inverse, #1f2328);
        }
      }

      .day-cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--wk-font-size-b3);
        border-radius: var(--wk-radius-sm);
        cursor: pointer;
        color: var(--wk-color-on-surface);
        position: relative;
        transition: background-color 0.15s ease, color 0.15s ease;

        &:hover { background: var(--wk-color-surface); }

        &.today {
          font-weight: var(--wk-font-weight-semibold);
          color: var(--wk-color-action);

          &::after {
            content: '';
            position: absolute;
            bottom: 3px; left: 50%;
            transform: translateX(-50%);
            width: 4px; height: 4px;
            border-radius: 50%;
            background: currentColor;
          }
        }

        &.selected {
          background: var(--wk-color-action);
          color: white;
          font-weight: var(--wk-font-weight-medium);
          &::after { display: none; }
          &:hover { background: var(--wk-color-action); }
        }

        &.range-start {
          background: var(--wk-color-action);
          color: white;
          border-radius: var(--wk-radius-sm) 0 0 var(--wk-radius-sm);
          &::after { display: none; }
          &:hover { background: var(--wk-color-action); }
        }

        &.range-end {
          background: var(--wk-color-action);
          color: white;
          border-radius: 0 var(--wk-radius-sm) var(--wk-radius-sm) 0;
          &::after { display: none; }
          &:hover { background: var(--wk-color-action); }
        }

        &.range-start.range-end {
          border-radius: var(--wk-radius-sm);
        }

        &.in-range {
          background: var(--wk-color-action-subtle);
          color: var(--wk-color-action-on-subtle);
          border-radius: 0;
          &:hover { background: var(--wk-color-action-subtle); }
        }

        &.hover-start {
          background: var(--wk-color-action);
          color: white;
          opacity: 0.7;
          border-radius: var(--wk-radius-sm) 0 0 var(--wk-radius-sm);
        }

        &.hover-end {
          background: var(--wk-color-action);
          color: white;
          opacity: 0.7;
          border-radius: 0 var(--wk-radius-sm) var(--wk-radius-sm) 0;
        }

        &.hover-range {
          background: var(--wk-color-action-subtle);
          color: var(--wk-color-action-on-subtle);
          opacity: 0.6;
          border-radius: 0;
        }

        &.disabled {
          cursor: not-allowed;
          color: var(--wk-color-on-surface-muted);
          opacity: 0.4;
          &:hover { background: transparent; }
          &::after { display: none; }
        }

        &:focus-visible {
          outline: 2px solid var(--wk-color-action);
          outline-offset: 1px;
          z-index: 1;
        }

        &.empty {
          cursor: default;
          pointer-events: none;
        }
      }

      /* ── Footer ────────────────────────────────────────────────────── */

      .footer {
        display: flex;
        justify-content: flex-end;
        margin-top: var(--wk-space-3);
        padding-top: var(--wk-space-3);
        border-top: 1px solid var(--wk-color-border);
      }
    `,
  ];

  // ── Properties ──────────────────────────────────────────────────────────────

  @property() mode: Mode = 'single';

  /** ISO date for single mode */
  @property() value = '';

  /** ISO dates for range mode */
  @property() from = '';
  @property() to   = '';

  /** Constraints */
  @property({ attribute: 'min-date' })  minDate = '';
  @property({ attribute: 'max-date' })  maxDate = '';
  @property({ type: Number, attribute: 'min-days' }) minDays = 1;
  @property({ type: Number, attribute: 'max-days' }) maxDays = 0;
  @property({ type: Boolean, attribute: 'business-days-only' }) businessDaysOnly = false;

  @property() locale = '';

  /**
   * Mes a mostrar al abrir (YYYY-MM). El usuario puede navegar libremente
   * después; solo se aplica cuando la propiedad cambia.
   */
  @property({ attribute: 'view-date' }) viewDate = '';

  /** Oculta selection-info y footer; útil cuando se embebe dentro de otro componente. */
  @property({ type: Boolean }) compact = false;

  @state() private _viewYear  = new Date().getFullYear();
  @state() private _viewMonth = new Date().getMonth();
  @state() private _hoverDate: Date | null = null;
  @state() private _rangeStep: 'from' | 'to' = 'from';
  @state() private _tipContent = '';
  @state() private _tipX = 0;
  @state() private _tipY = 0;
  @state() private _focusDate: Date | null = null;
  @state() private _announcement = '';

  // ── Locale ──────────────────────────────────────────────────────────────────

  private get _loc(): string {
    return this.locale || navigator.language || 'es-CL';
  }

  private get _firstDayOfWeek(): number {
    try {
      const info = (new Intl.Locale(this._loc) as any).getWeekInfo?.();
      const iso = info?.firstDay ?? 1;
      return iso === 7 ? 0 : iso;
    } catch { return 1; }
  }

  private get _weekHeaders(): string[] {
    const fmt = new Intl.DateTimeFormat(this._loc, { weekday: 'short' });
    const base = new Date(2024, 0, 1); // Monday
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return fmt.format(d);
    });
    return this._firstDayOfWeek === 0 ? [days[6], ...days.slice(0, 6)] : days;
  }

  // ── Constraint check ─────────────────────────────────────────────────────────

  private _checkDisabled(date: Date): { disabled: boolean; reason: string } {
    const min = parseISO(this.minDate);
    const max = parseISO(this.maxDate);

    if (min && date < min && !sameDay(date, min))
      return { disabled: true, reason: 'Fecha no disponible' };
    if (max && date > max && !sameDay(date, max))
      return { disabled: true, reason: 'Fecha no disponible' };
    if (this.businessDaysOnly && isWeekend(date))
      return { disabled: true, reason: 'Solo días hábiles' };

    const applyDayConstraints = this.mode === 'range' &&
      (this._rangeStep === 'to' || (this._rangeStep === 'from' && !!this.from && !!this.to));
    if (applyDayConstraints) {
      const fromDate = parseISO(this.from);
      if (fromDate) {
        if (this.minDays > 1 && !sameDay(date, fromDate)) {
          const minTo = this.businessDaysOnly
            ? nthBusinessDay(fromDate, this.minDays)
            : localDate(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + this.minDays - 1);
          if (date < minTo)
            return { disabled: true, reason: `Mínimo ${this.minDays} días hábiles` };
        }
        if (this.maxDays > 0) {
          const maxTo = this.businessDaysOnly
            ? nthBusinessDay(fromDate, this.maxDays)
            : localDate(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + this.maxDays - 1);
          if (date > maxTo)
            return { disabled: true, reason: `Máximo ${this.maxDays} días hábiles` };
        }
      }
    }

    return { disabled: false, reason: '' };
  }

  // ── Grid ────────────────────────────────────────────────────────────────────

  private get _daysInMonth(): number {
    return new Date(this._viewYear, this._viewMonth + 1, 0).getDate();
  }

  private get _emptyCells(): number {
    const start = new Date(this._viewYear, this._viewMonth, 1).getDay();
    return (start - this._firstDayOfWeek + 7) % 7;
  }

  private _buildGrid(): Array<DayCell | null> {
    const today    = new Date();
    const selected = parseISO(this.value);
    const fromDate = parseISO(this.from);
    const toDate   = parseISO(this.to);
    const hover    = this._hoverDate;

    const cells: Array<DayCell | null> = Array(this._emptyCells).fill(null);

    for (let d = 1; d <= this._daysInMonth; d++) {
      const date = localDate(this._viewYear, this._viewMonth, d);
      const { disabled, reason } = this._checkDisabled(date);

      let isSelected = false, isRangeStart = false, isRangeEnd = false;
      let isInRange = false, isHoverRange = false;
      let isHoverStart = false, isHoverEnd = false;

      if (this.mode === 'single') {
        isSelected = !!selected && sameDay(date, selected);
      } else {
        if (fromDate && toDate) {
          const adjHover = hover && hover >= fromDate ? hover : null;
          if (adjHover) {
            // Preview: from stays confirmed, hover end is tentative
            isRangeStart = sameDay(date, fromDate);
            isHoverEnd   = sameDay(date, adjHover) && !sameDay(adjHover, fromDate);
            isHoverRange = date > fromDate && date < adjHover;
          } else {
            // Confirmed range
            isRangeStart = sameDay(date, fromDate);
            isRangeEnd   = sameDay(date, toDate);
            isInRange    = date > fromDate && date < toDate;
          }
        } else if (fromDate && hover && !toDate && !disabled) {
          const lo = fromDate <= hover ? fromDate : hover;
          const hi = fromDate <= hover ? hover   : fromDate;
          isRangeStart = sameDay(date, lo);
          isRangeEnd   = sameDay(date, hi);
          isHoverRange = date > lo && date < hi;
          // Distinguish confirmed from from hover previews
          if (sameDay(date, fromDate)) { isRangeStart = true; isHoverStart = false; }
          else if (sameDay(date, lo) && !sameDay(lo, fromDate)) { isHoverStart = true; isRangeStart = false; }
          if (sameDay(date, hi) && !sameDay(hi, fromDate)) { isHoverEnd = true; isRangeEnd = false; }
        } else if (fromDate && !toDate) {
          isRangeStart = sameDay(date, fromDate);
        }
      }

      cells.push({
        date, day: d,
        isToday: sameDay(date, today),
        isSelected, isRangeStart, isRangeEnd,
        isInRange, isHoverRange, isHoverStart, isHoverEnd,
        disabled, disabledReason: reason,
      });
    }

    return cells;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  private _canGoPrev(): boolean {
    const min = parseISO(this.minDate);
    if (!min) return true;
    // Last day of the previous month
    const lastOfPrev = new Date(this._viewYear, this._viewMonth, 0);
    return lastOfPrev >= min;
  }

  private _canGoNext(): boolean {
    const max = parseISO(this.maxDate);
    if (!max) return true;
    // First day of the next month
    const firstOfNext = new Date(this._viewYear, this._viewMonth + 1, 1);
    return firstOfNext <= max;
  }

  private _prevMonth(): void {
    if (!this._canGoPrev()) return;
    if (this._viewMonth === 0) { this._viewMonth = 11; this._viewYear--; }
    else this._viewMonth--;
  }

  private _nextMonth(): void {
    if (!this._canGoNext()) return;
    if (this._viewMonth === 11) { this._viewMonth = 0; this._viewYear++; }
    else this._viewMonth++;
  }

  private _headerLabel(): string {
    return new Intl.DateTimeFormat(this._loc, { month: 'long', year: 'numeric' })
      .format(new Date(this._viewYear, this._viewMonth, 1));
  }

  // ── Interaction ──────────────────────────────────────────────────────────────

  private _onClick(cell: DayCell): void {
    if (cell.disabled) return;

    if (this.mode === 'single') {
      this.value = toISO(cell.date);
      this._emit('ui-change', { date: cell.date });
      return;
    }

    const fromDate = parseISO(this.from);
    const toDate   = parseISO(this.to);

    // Range complete: click adjusts 'to' or resets 'from'
    if (fromDate && toDate) {
      if (cell.date >= fromDate) {
        if (sameDay(cell.date, fromDate) && this.minDays > 1) return;
        this.to = toISO(cell.date);
        this._rangeStep = 'from';
        this._hoverDate = null;
        this._emit('ui-change', { from: fromDate, to: cell.date });
      } else {
        this.from = toISO(cell.date);
        this.to   = '';
        this._rangeStep = 'to';
      }
      return;
    }

    if (this._rangeStep === 'from') {
      this.from = toISO(cell.date);
      this.to   = '';
      this._rangeStep = 'to';
      return;
    }

    // 'to' step
    if (!fromDate) return;

    if (sameDay(cell.date, fromDate)) {
      if (this.minDays > 1) return;
      this.to = toISO(cell.date);
      this._rangeStep = 'from';
      this._hoverDate = null;
      this._emit('ui-change', { from: fromDate, to: cell.date });
      return;
    }

    if (cell.date < fromDate) {
      this.from = toISO(cell.date);
      this.to   = '';
      return;
    }

    this.to = toISO(cell.date);
    this._rangeStep = 'from';
    this._hoverDate = null;
    this._emit('ui-change', { from: fromDate, to: cell.date });
  }

  private _onHover(cell: DayCell): void {
    if (this.mode !== 'range' || cell.disabled) return;
    if (this._rangeStep === 'to') {
      this._hoverDate = cell.date;
      return;
    }
    // Adjustment mode: complete range → preview new 'to'
    if (this.from && this.to) {
      const fromDate = parseISO(this.from);
      this._hoverDate = (fromDate && cell.date >= fromDate) ? cell.date : null;
    }
  }

  private _clear(): void {
    this.value = '';
    this.from  = '';
    this.to    = '';
    this._rangeStep = 'from';
    this._hoverDate = null;
    this._emit('ui-clear', {});
  }

  private _emit(name: string, detail: object): void {
    if (name === 'ui-change') {
      if (this.mode === 'single') {
        this._announcement = `Fecha seleccionada: ${this._ariaLabel((detail as any).date)}`;
      } else {
        const { from, to } = detail as any;
        this._announcement = `Rango seleccionado: desde ${this._ariaLabel(from)} hasta ${this._ariaLabel(to)}`;
      }
    }
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  // ── Accessibility ────────────────────────────────────────────────────────────

  private _ariaLabel(date: Date): string {
    return new Intl.DateTimeFormat(this._loc, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(date);
  }

  private _ariaSelected(cell: DayCell): string {
    return (cell.isSelected || cell.isRangeStart || cell.isRangeEnd || cell.isInRange)
      ? 'true' : 'false';
  }

  private get _effectiveFocusDate(): Date {
    if (this._focusDate) return this._focusDate;
    const from = parseISO(this.from);
    if (from && from.getFullYear() === this._viewYear && from.getMonth() === this._viewMonth)
      return from;
    const today = new Date();
    if (today.getFullYear() === this._viewYear && today.getMonth() === this._viewMonth)
      return today;
    return localDate(this._viewYear, this._viewMonth, 1);
  }

  private _focusCell(): void {
    this.updateComplete.then(() => {
      (this.shadowRoot?.querySelector<HTMLElement>('.day-cell[tabindex="0"]'))?.focus();
    });
  }

  private _moveFocus(days: number): void {
    const next = new Date(this._effectiveFocusDate);
    next.setDate(next.getDate() + days);
    this._focusDate = next;
    if (next.getMonth() !== this._viewMonth || next.getFullYear() !== this._viewYear) {
      days > 0 ? this._nextMonth() : this._prevMonth();
    }
    this._focusCell();
  }

  private _onGridKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); this._moveFocus(-1); break;
      case 'ArrowRight': e.preventDefault(); this._moveFocus(1);  break;
      case 'ArrowUp':    e.preventDefault(); this._moveFocus(-7); break;
      case 'ArrowDown':  e.preventDefault(); this._moveFocus(7);  break;
      case 'PageUp':     e.preventDefault(); this._prevMonth();   break;
      case 'PageDown':   e.preventDefault(); this._nextMonth();   break;
      case 'Home': {
        e.preventDefault();
        this._focusDate = localDate(this._viewYear, this._viewMonth, 1);
        this._focusCell();
        break;
      }
      case 'End': {
        e.preventDefault();
        this._focusDate = localDate(this._viewYear, this._viewMonth, this._daysInMonth);
        this._focusCell();
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const fd = this._effectiveFocusDate;
        const cell = this._buildGrid().find(c => c !== null && sameDay(c.date, fd)) as DayCell | undefined;
        if (cell) this._onClick(cell);
        break;
      }
      case 'Escape': {
        e.preventDefault();
        if (this.mode === 'range' && this._rangeStep === 'to') {
          this.from = '';
          this._rangeStep = 'from';
        }
        break;
      }
    }
  }

  private _onTouchDisabled(cell: DayCell, e: TouchEvent): void {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this._tipContent = cell.disabledReason;
    this._tipX = touch.clientX;
    this._tipY = touch.clientY - 8;
    setTimeout(() => { this._tipContent = ''; }, 2000);
  }

  // ── Formatting ───────────────────────────────────────────────────────────────

  private _formatDate(iso: string): string {
    const d = parseISO(iso);
    if (!d) return '';
    return new Intl.DateTimeFormat(this._loc, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }

  // ── Cell classes ─────────────────────────────────────────────────────────────

  private _cellClass(c: DayCell): string {
    return [
      'day-cell',
      c.isToday       && 'today',
      c.isSelected    && 'selected',
      c.isRangeStart  && 'range-start',
      c.isRangeEnd    && 'range-end',
      c.isInRange     && 'in-range',
      c.isHoverStart  && 'hover-start',
      c.isHoverEnd    && 'hover-end',
      c.isHoverRange  && 'hover-range',
      c.disabled      && 'disabled',
    ].filter(Boolean).join(' ');
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  private _renderSelectionInfo() {
    const hasSelection = this.mode === 'single' ? !!this.value : !!(this.from || this.to);
    if (!hasSelection && this.mode === 'single') return nothing;

    if (this.mode === 'single') {
      return html`
        <div class="selection-info">
          <div class="date-label">
            <span class="date-label__title">Fecha</span>
            ${this.value
              ? html`<span class="date-label__value">${this._formatDate(this.value)}</span>`
              : html`<span class="date-label__placeholder">—</span>`}
          </div>
        </div>`;
    }

    return html`
      <div class="selection-info">
        <div
          class="date-label ${this._rangeStep === 'from' && !this.to ? 'active' : ''}"
          @click=${() => this._selectStep('from')}
        >
          <span class="date-label__title">Desde</span>
          ${this.from
            ? html`<span class="date-label__value">${this._formatDate(this.from)}</span>`
            : html`<span class="date-label__placeholder">—</span>`}
        </div>
        <span class="date-sep">→</span>
        <div
          class="date-label ${this._rangeStep === 'to' && !this.to ? 'active' : ''}"
          @click=${() => this._selectStep('to')}
        >
          <span class="date-label__title">Hasta</span>
          ${this.to
            ? html`<span class="date-label__value">${this._formatDate(this.to)}</span>`
            : html`<span class="date-label__placeholder">—</span>`}
        </div>
      </div>`;
  }

  private _onHoverDisabled(cell: DayCell, e: MouseEvent): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this._tipContent = cell.disabledReason;
    this._tipX = rect.left + rect.width / 2;
    this._tipY = rect.top - 8;
  }

  private _onLeaveDisabled(): void {
    this._tipContent = '';
  }

  private _selectStep(step: 'from' | 'to'): void {
    if (step === 'to' && !this.from) return;
    this.to = '';
    this._rangeStep = step;
    this._hoverDate = null;
  }

  private _renderCell(cell: DayCell) {
    const focused = sameDay(cell.date, this._effectiveFocusDate);
    const label   = this._ariaLabel(cell.date);

    if (cell.disabled && cell.disabledReason) {
      return html`
        <div
          role="gridcell"
          class="${this._cellClass(cell)}"
          tabindex="${focused ? 0 : -1}"
          aria-label="${label}"
          aria-disabled="true"
          aria-selected="false"
          @mouseenter=${(e: MouseEvent) => this._onHoverDisabled(cell, e)}
          @mouseleave=${() => this._onLeaveDisabled()}
          @touchstart=${(e: TouchEvent) => this._onTouchDisabled(cell, e)}
          @focus=${() => { this._focusDate = cell.date; }}
        >${cell.day}</div>`;
    }
    return html`
      <div
        role="gridcell"
        class="${this._cellClass(cell)}"
        tabindex="${focused ? 0 : -1}"
        aria-label="${label}"
        aria-disabled="false"
        aria-selected="${this._ariaSelected(cell)}"
        @click=${() => this._onClick(cell)}
        @mouseenter=${() => this._onHover(cell)}
        @focus=${() => { this._focusDate = cell.date; }}
      >${cell.day}</div>`;
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('viewDate') && this.viewDate) {
      const [y, m] = this.viewDate.split('-').map(Number);
      if (y && m >= 1 && m <= 12) {
        this._viewYear  = y;
        this._viewMonth = m - 1;
      }
    }
  }

  override render() {
    const grid    = this._buildGrid();
    const hasData = this.mode === 'single' ? !!this.value : !!(this.from || this.to);

    return html`
      <div class="calendar">

        ${this.compact ? nothing : this._renderSelectionInfo()}

        <div class="header">
          <button class="nav-btn" @click=${this._prevMonth} ?disabled=${!this._canGoPrev()} aria-label="Mes anterior">
            <i class="material-icons">chevron_left</i>
          </button>
          <span class="header-label">${this._headerLabel()}</span>
          <button class="nav-btn" @click=${this._nextMonth} ?disabled=${!this._canGoNext()} aria-label="Mes siguiente">
            <i class="material-icons">chevron_right</i>
          </button>
        </div>

        <div class="week-headers" role="row">
          ${this._weekHeaders.map(h => html`<div class="week-day-header" role="columnheader">${h}</div>`)}
        </div>

        <div
          class="days-grid"
          role="grid"
          aria-label="Selector de fecha"
          @keydown=${this._onGridKeyDown}
          @mouseleave=${() => { this._hoverDate = null; this._tipContent = ''; }}
        >
          ${grid.map(cell => cell === null
            ? html`<div class="day-cell empty" role="gridcell" aria-hidden="true"></div>`
            : this._renderCell(cell)
          )}
        </div>

        <div class="sr-only" aria-live="polite" aria-atomic="true">${this._announcement}</div>

        ${!this.compact && hasData ? html`
          <div class="footer">
            <ui-button type="TERTIARY" @ui-click=${this._clear}>Limpiar</ui-button>
          </div>` : nothing}

      </div>

      ${this._tipContent ? html`
        <div class="inline-tip" style="left:${this._tipX}px;top:${this._tipY}px">
          ${this._tipContent}
        </div>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-calendar': UiCalendar;
  }
}
