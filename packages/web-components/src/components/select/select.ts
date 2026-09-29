import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { generateId } from '@design-lib/core';
import { inputBaseStyles } from '../../styles/input-base.styles';
import { materialIconsStyles } from '../../styles/material-icons.styles';
import { defaultFontFamily } from '../../styles/default-font.styles';
import type { SelectOption, SelectChangeDetail } from './select.types';

interface OptionGroup {
  label: string | null;
  options: SelectOption[];
}

@customElement('ui-select')
export class UiSelect extends LitElement {
  static override styles = [
    defaultFontFamily,
    materialIconsStyles,
    inputBaseStyles,
    css`
      :host { display: block; }

      /* ── Chevron rotation ─────────────────────────────── */
      .select-chevron {
        font-size: 1.1rem;
        transition: transform var(--wk-transition-normal, 0.15s ease);
        pointer-events: none;
        user-select: none;
        flex-shrink: 0;
      }

      .input-field--focused .select-chevron { transform: rotate(180deg); }

      /* ── Dropdown container (position: fixed) ─────────── */
      .dropdown {
        position: fixed;
        z-index: var(--wk-z-dropdown, 1000);
        background: var(--wk-color-surface, #fff);
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-radius: var(--wk-radius-md, 6px);
        box-shadow: var(--wk-shadow-120, 0 6px 12px rgba(55,71,79,.2));
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: dropdown-in 0.12s ease;
      }

      @keyframes dropdown-in {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ── Search row ───────────────────────────────────── */
      .dropdown-search {
        display: flex;
        align-items: center;
        gap: var(--wk-space-2, 8px);
        padding: var(--wk-space-2, 8px) var(--wk-space-3, 12px);
        border-bottom: 1px solid var(--wk-color-border, #e2e8ea);
        flex-shrink: 0;
      }

      .search-icon {
        font-size: 1rem;
        color: var(--wk-color-on-surface-muted, #546e7a);
        flex-shrink: 0;
      }

      .search-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-family: inherit;
        font-size: var(--wk-font-size-b1, 0.875rem);
        color: var(--wk-color-on-surface, #37474f);
        line-height: 1.5;
        min-width: 0;
      }

      .search-input::placeholder { color: var(--wk-color-on-surface-muted, #546e7a); }

      /* ── Options scroll area ──────────────────────────── */
      .dropdown-options {
        overflow-y: auto;
        flex: 1;
        overscroll-behavior: contain;
      }

      /* ── Group label ──────────────────────────────────── */
      .dropdown-group-label {
        padding: var(--wk-space-2, 8px) var(--wk-space-3, 12px) var(--wk-space-1, 4px);
        font-size: 0.6875rem;
        font-weight: var(--wk-font-weight-semibold, 600);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--wk-color-on-surface-muted, #546e7a);
        user-select: none;
      }

      /* ── Option item ──────────────────────────────────── */
      .dropdown-option {
        display: flex;
        align-items: center;
        gap: var(--wk-space-2, 8px);
        padding: 9px var(--wk-space-3, 12px);
        cursor: pointer;
        color: var(--wk-color-on-surface, #37474f);
        user-select: none;
        transition: background var(--wk-transition-fast, 0.1s ease);
        outline: none;
      }

      .dropdown-option:hover:not(.dropdown-option--disabled),
      .dropdown-option--active:not(.dropdown-option--disabled) {
        background: var(--wk-color-surface-alt, #f6f7f8);
      }

      .dropdown-option--selected {
        color: var(--wk-color-action, #28892b);
        font-weight: var(--wk-font-weight-medium, 500);
      }

      .dropdown-option--selected.dropdown-option--active {
        background: var(--wk-color-action, #28892b);
        color: var(--wk-color-action-on, #ffffff);
      }

      .dropdown-option--selected.dropdown-option--active .option-icon,
      .dropdown-option--selected.dropdown-option--active .option-check,
      .dropdown-option--selected.dropdown-option--active .option-desc {
        color: var(--wk-color-action-on, #ffffff);
        opacity: 0.85;
      }

      .dropdown-option--disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }

      /* ── Option content ───────────────────────────────── */
      .option-icon {
        font-size: 1.1rem;
        color: var(--wk-color-on-surface-muted, #546e7a);
        flex-shrink: 0;
      }

      .dropdown-option--selected .option-icon { color: var(--wk-color-action, #28892b); }

      .option-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .option-label {
        font-size: var(--wk-font-size-b1, 0.875rem);
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .option-desc {
        font-size: var(--wk-font-size-b3, 0.8125rem);
        color: var(--wk-color-on-surface-muted, #546e7a);
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .option-check {
        font-size: 1rem;
        color: var(--wk-color-action, #28892b);
        flex-shrink: 0;
      }

      /* ── Empty state ──────────────────────────────────── */
      .dropdown-empty {
        padding: var(--wk-space-4, 16px) var(--wk-space-3, 12px);
        text-align: center;
        font-size: var(--wk-font-size-b1, 0.875rem);
        color: var(--wk-color-on-surface-muted, #546e7a);
      }

      /* ── Accessibility ────────────────────────────────── */
      .sr-only {
        position: absolute;
        width: 1px; height: 1px;
        padding: 0; margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ];

  // ── Public properties ────────────────────────────────────────────
  @property() label = '';
  @property() placeholder = 'Selecciona una opción';
  @property() value = '';
  @property({ type: Array }) options: SelectOption[] = [];
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property({ attribute: 'helper-text' }) helperText = '';
  @property({ attribute: 'error-text' }) errorText = '';
  @property({ type: Number, attribute: 'search-threshold' }) searchThreshold = 8;
  @property({ type: Boolean, attribute: 'smart-position' }) smartPosition = false;

  // ── Internal state ───────────────────────────────────────────────
  @state() private _open = false;
  @state() private _search = '';
  @state() private _activeIndex = -1;
  @state() private _dropdownStyles: Record<string, string> = {};
  @state() private _announcement = '';

  @query('.input-field') private _triggerEl!: HTMLElement;
  @query('.dropdown') private _dropdownEl?: HTMLElement;
  @query('.search-input') private _searchInputEl?: HTMLInputElement;

  // ── IDs ─────────────────────────────────────────────────────────
  private readonly _uid = generateId('ui-select');
  private readonly _listboxId = `${this._uid}-lb`;
  private readonly _labelId  = `${this._uid}-label`;

  // ── Bound handlers (stable references for add/removeEventListener)
  private readonly _boundOutsideClick = (e: MouseEvent) => {
    if (!e.composedPath().includes(this)) this._closeDropdown(false);
  };
  private readonly _boundUpdatePosition = () => this._updatePosition();

  // ── Computed ─────────────────────────────────────────────────────
  private get _selectedOption(): SelectOption | undefined {
    return this.options.find(o => o.value === this.value);
  }

  private get _showSearch(): boolean {
    return this.options.length >= this.searchThreshold;
  }

  private get _filteredOptions(): SelectOption[] {
    if (!this._search) return this.options;
    const q = this._search.toLowerCase();
    return this.options.filter(o => o.label.toLowerCase().includes(q));
  }

  /** Options grouped for rendering (ungrouped first, then named groups). */
  private get _groups(): OptionGroup[] {
    const named = new Map<string, SelectOption[]>();
    const none: SelectOption[] = [];
    for (const o of this._filteredOptions) {
      if (o.group) {
        if (!named.has(o.group)) named.set(o.group, []);
        named.get(o.group)!.push(o);
      } else {
        none.push(o);
      }
    }
    const result: OptionGroup[] = [];
    if (none.length) result.push({ label: null, options: none });
    for (const [label, opts] of named) result.push({ label, options: opts });
    return result;
  }

  /** Flat list in visual/keyboard order (matching what's rendered). */
  private get _navOptions(): SelectOption[] {
    return this._groups.flatMap(g => g.options);
  }

  // ── Lifecycle ────────────────────────────────────────────────────
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._removeGlobalListeners();
  }

  // ── Global listener management ───────────────────────────────────
  private _addGlobalListeners(): void {
    document.addEventListener('click', this._boundOutsideClick, true);
    window.addEventListener('scroll', this._boundUpdatePosition, { passive: true, capture: true } as EventListenerOptions);
    window.addEventListener('resize', this._boundUpdatePosition);
  }

  private _removeGlobalListeners(): void {
    document.removeEventListener('click', this._boundOutsideClick, true);
    window.removeEventListener('scroll', this._boundUpdatePosition, true);
    window.removeEventListener('resize', this._boundUpdatePosition);
  }

  // ── Open / close ─────────────────────────────────────────────────
  private _openDropdown(): void {
    if (this.disabled || this.readonly || this._open) return;
    this._open = true;
    this._search = '';
    this._activeIndex = this._navOptions.findIndex(o => o.value === this.value);
    this._updatePosition();
    this._addGlobalListeners();

    this.updateComplete.then(() => {
      if (this._showSearch) {
        this._searchInputEl?.focus();
      }
    });
  }

  private _closeDropdown(returnFocus = true): void {
    if (!this._open) return;
    this._open = false;
    this._search = '';
    this._activeIndex = -1;
    this._removeGlobalListeners();
    if (returnFocus) this._triggerEl?.focus();
  }

  // ── Selection ────────────────────────────────────────────────────
  private _selectOption(opt: SelectOption): void {
    if (opt.disabled) return;
    const prev = this.value;
    this.value = opt.value;
    this._announcement = `${opt.label} seleccionado`;
    this._closeDropdown();
    if (prev !== opt.value) {
      this._emit<SelectChangeDetail>('ui-change', { value: opt.value, option: opt });
    }
  }

  // ── Position ─────────────────────────────────────────────────────
  private _updatePosition(): void {
    if (!this._open) return;
    const rect = this._triggerEl?.getBoundingClientRect();
    if (!rect) return;

    const MARGIN = 4;
    const MAX_HEIGHT = 280;

    let top: number;
    let maxHeight: number;

    if (this.smartPosition) {
      const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
      const spaceAbove = rect.top - MARGIN;
      if (spaceBelow < 120 && spaceAbove > spaceBelow) {
        maxHeight = Math.min(spaceAbove, MAX_HEIGHT);
        top = rect.top - maxHeight - MARGIN;
      } else {
        maxHeight = Math.min(spaceBelow, MAX_HEIGHT);
        top = rect.bottom + MARGIN;
      }
    } else {
      maxHeight = MAX_HEIGHT;
      top = rect.bottom + MARGIN;
    }

    this._dropdownStyles = {
      top: `${top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${maxHeight}px`,
    };
  }

  // ── Keyboard navigation ───────────────────────────────────────────
  private _onTriggerKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Enter': case ' ':
        e.preventDefault();
        this._open ? this._closeDropdown() : this._openDropdown();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!this._open) { this._openDropdown(); break; }
        this._moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this._open) { this._openDropdown(); break; }
        this._moveActive(-1);
        break;
      case 'Escape':
        e.preventDefault();
        this._closeDropdown();
        break;
      case 'Tab':
        this._closeDropdown(false);
        break;
    }
  }

  private _onDropdownKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        this._setActiveEdge('first');
        break;
      case 'End':
        e.preventDefault();
        this._setActiveEdge('last');
        break;
      case 'Enter': case ' ':
        if (e.key === ' ' && this._showSearch) break; // space is typing in search
        e.preventDefault();
        if (this._activeIndex >= 0) this._selectOption(this._navOptions[this._activeIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        this._closeDropdown();
        break;
      case 'Tab':
        this._closeDropdown(false);
        break;
    }
  }

  private _moveActive(delta: number): void {
    const opts = this._navOptions;
    let idx = this._activeIndex + delta;
    while (idx >= 0 && idx < opts.length && opts[idx].disabled) idx += delta;
    if (idx >= 0 && idx < opts.length) {
      this._activeIndex = idx;
      this._scrollActiveIntoView();
    }
  }

  private _setActiveEdge(edge: 'first' | 'last'): void {
    const opts = this._navOptions;
    const indices = opts.map((o, i) => ({ o, i })).filter(x => !x.o.disabled);
    const target = edge === 'first' ? indices[0] : indices[indices.length - 1];
    if (target) { this._activeIndex = target.i; this._scrollActiveIntoView(); }
  }

  private _scrollActiveIntoView(): void {
    this.updateComplete.then(() => {
      this._dropdownEl
        ?.querySelector<HTMLElement>(`[data-idx="${this._activeIndex}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }

  // ── Emit ──────────────────────────────────────────────────────────
  private _emit<T>(name: string, detail: T): void {
    this.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: true, composed: true }));
  }

  // ── Render helpers ────────────────────────────────────────────────
  private _renderOption(opt: SelectOption, idx: number) {
    const isSelected = opt.value === this.value;
    const isActive = idx === this._activeIndex;
    return html`
      <div
        role="option"
        id="${this._uid}-opt-${idx}"
        data-idx="${idx}"
        aria-selected="${isSelected}"
        aria-disabled="${opt.disabled ? 'true' : 'false'}"
        class=${classMap({
          'dropdown-option':           true,
          'dropdown-option--selected': isSelected,
          'dropdown-option--active':   isActive,
          'dropdown-option--disabled': !!opt.disabled,
        })}
        @click=${() => this._selectOption(opt)}
        @mouseenter=${() => { if (!opt.disabled) this._activeIndex = idx; }}
      >
        ${opt.icon ? html`<i class="material-icons option-icon">${opt.icon}</i>` : nothing}
        <span class="option-content">
          <span class="option-label">${opt.label}</span>
          ${opt.description ? html`<span class="option-desc">${opt.description}</span>` : nothing}
        </span>
        ${isSelected ? html`<i class="material-icons option-check">check</i>` : nothing}
      </div>
    `;
  }

  private _renderDropdown() {
    if (!this._open) return nothing;
    const groups = this._groups;
    const navOpts = this._navOptions;
    const activeDescendant = this._activeIndex >= 0
      ? `${this._uid}-opt-${this._activeIndex}`
      : undefined;

    let runningIdx = 0;

    return html`
      <div
        class="dropdown"
        role="listbox"
        id="${this._listboxId}"
        aria-label="${this.label || 'Opciones'}"
        aria-activedescendant="${ifDefined(activeDescendant)}"
        style=${styleMap(this._dropdownStyles)}
        @keydown=${this._onDropdownKeyDown}
      >
        ${this._showSearch ? html`
          <div class="dropdown-search">
            <i class="material-icons search-icon">search</i>
            <input
              class="search-input"
              type="text"
              autocomplete="off"
              placeholder="Buscar…"
              .value="${this._search}"
              @input="${(e: Event) => {
                this._search = (e.target as HTMLInputElement).value;
                this._activeIndex = -1;
              }}"
            />
          </div>
        ` : nothing}

        <div class="dropdown-options">
          ${navOpts.length === 0 ? html`
            <div class="dropdown-empty">Sin resultados</div>
          ` : groups.map(g => html`
            ${g.label ? html`<div class="dropdown-group-label">${g.label}</div>` : nothing}
            ${g.options.map(opt => this._renderOption(opt, runningIdx++))}
          `)}
        </div>
      </div>
    `;
  }

  override render() {
    const selected = this._selectedOption;
    const activeDescendant = this._open && this._activeIndex >= 0
      ? `${this._uid}-opt-${this._activeIndex}`
      : undefined;

    return html`
      <div class="input-wrap">

        ${this.label ? html`
          <label id="${this._labelId}" class="input-label">${this.label}</label>
        ` : nothing}

        <div
          class=${classMap({
            'input-field':           true,
            'input-field--focused':  this._open,
            'input-field--filled':   !!selected,
            'input-field--error':    this.invalid,
            'input-field--disabled': this.disabled,
            'input-field--readonly': this.readonly,
          })}
          role="combobox"
          tabindex="${this.disabled ? -1 : 0}"
          aria-expanded="${this._open}"
          aria-haspopup="listbox"
          aria-controls="${this._listboxId}"
          aria-labelledby="${ifDefined(this.label ? this._labelId : undefined)}"
          aria-activedescendant="${ifDefined(activeDescendant)}"
          aria-disabled="${ifDefined(this.disabled ? 'true' : undefined)}"
          aria-readonly="${ifDefined(this.readonly ? 'true' : undefined)}"
          aria-invalid="${ifDefined(this.invalid ? 'true' : undefined)}"
          @click="${() => this._open ? this._closeDropdown() : this._openDropdown()}"
          @keydown="${this._onTriggerKeyDown}"
        >
          ${selected
            ? html`<span class="input-value">${selected.label}</span>`
            : html`<span class="input-placeholder">${this.placeholder}</span>`
          }
          <i class="material-icons select-chevron input-icon">expand_more</i>
        </div>

        ${this.invalid && this.errorText
          ? html`<span class="input-error-msg" role="alert">${this.errorText}</span>`
          : this.helperText
            ? html`<span class="input-helper">${this.helperText}</span>`
            : nothing
        }

      </div>

      ${this._renderDropdown()}

      <div aria-live="polite" aria-atomic="true" class="sr-only">${this._announcement}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-select': UiSelect;
  }
}
