import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { defaultFontFamily } from '../../styles/default-font.styles';
import { materialIconsStyles } from '../../styles/material-icons.styles';
import type {
  TableColumn,
  TableSelectDetail,
  TableSortDetail,
  TablePageDetail,
} from './table.types';

type Row = Record<string, any>;

/**
 * Tabla de datos con soporte para:
 * - Checkbox de selección por fila y select-all
 * - Ordenamiento por columnas (client-side)
 * - Paginador integrado con selector de filas por página
 * - Modo server-side: el paginador emite eventos pero no corta las filas
 * - Estado de carga (skeleton) y estado vacío
 *
 * @fires {CustomEvent<TableSelectDetail>} ui-select    - Cambio en la selección
 * @fires {CustomEvent<TableSortDetail>}   ui-sort      - Cambio de ordenamiento
 * @fires {CustomEvent<TablePageDetail>}   ui-page      - Cambio de página o tamaño de página
 *
 * @csspart root    - Contenedor principal (.table-root)
 * @csspart table   - El elemento <table>
 * @csspart footer  - El paginador (.table-footer)
 */
@customElement('ui-table')
export class UiTable extends LitElement {
  static override styles = [
    defaultFontFamily,
    materialIconsStyles,
    css`
      :host {
        display: block;
        font-size: var(--wk-font-size-b1, 0.875rem);
      }

      /* ── Contenedor con borde ──────────────────────── */
      .table-root {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-radius: var(--wk-radius-lg, 8px);
        overflow: hidden;
        background: var(--wk-color-surface, #ffffff);
      }

      /* ── Scroll horizontal ───────────────────────── */
      .table-scroll {
        overflow-x: auto;
      }

      /* ── Tabla ───────────────────────────────────── */
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: auto;
      }

      /* ── Cabecera ────────────────────────────────── */
      thead th {
        text-align: left;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--wk-color-on-surface-muted, #546e7a);
        padding: 10px 12px;
        background: var(--wk-color-surface-alt, #f6f7f8);
        border-bottom: 2px solid var(--wk-color-border, #e2e8ea);
        white-space: nowrap;
        user-select: none;
        position: relative;
      }

      thead th.th-center { text-align: center; }
      thead th.th-right  { text-align: right;  }

      /* ── Cabecera ordenable ──────────────────────── */
      thead th.sortable {
        cursor: pointer;
        transition: background var(--wk-transition-normal, 0.15s ease);
      }

      thead th.sortable:hover {
        background: var(--wk-color-surface-raised, #eff0f1);
        color: var(--wk-color-on-surface, #37474f);
      }

      thead th.sort-active {
        color: var(--wk-color-on-surface, #37474f);
      }

      .th-inner {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .sort-icon {
        display: inline-flex;
        flex-shrink: 0;
        font-size: 16px;
        line-height: 1;
        opacity: 0.4;
        transition: opacity var(--wk-transition-normal, 0.15s ease);
      }

      thead th.sort-active .sort-icon { opacity: 1; }

      /* ── Filas ───────────────────────────────────── */
      tbody tr {
        border-bottom: 1px solid var(--wk-color-border, #e2e8ea);
        transition: background var(--wk-transition-normal, 0.15s ease);
      }

      tbody tr:last-child { border-bottom: none; }

      tbody tr:hover { background: var(--wk-color-surface-alt, #f6f7f8); }

      tbody tr.row--selected {
        background: var(--wk-color-action-subtle, #d3f0d3);
      }

      tbody tr.row--selected:hover {
        background: color-mix(in srgb, var(--wk-color-action-subtle, #d3f0d3) 75%, transparent);
      }

      /* ── Celdas ──────────────────────────────────── */
      td {
        padding: 10px 12px;
        color: var(--wk-color-on-surface, #37474f);
        vertical-align: middle;
      }

      td.td-center { text-align: center; }
      td.td-right  { text-align: right;  }

      /* ── Columna de checkbox ─────────────────────── */
      .col-check {
        width: 44px;
        padding: 0 4px 0 12px;
        text-align: center;
      }

      input[type='checkbox'] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--wk-color-action, #28892b);
        flex-shrink: 0;
      }

      input[type='checkbox']:disabled { cursor: not-allowed; opacity: 0.5; }

      /* ── Estado vacío ────────────────────────────── */
      .empty-cell {
        text-align: center;
        padding: 40px 16px;
        color: var(--wk-color-on-surface-muted, #546e7a);
      }

      .empty-icon {
        font-size: 40px;
        margin-bottom: 8px;
        opacity: 0.4;
      }

      .empty-text {
        font-size: 0.875rem;
      }

      /* ── Skeleton (loading) ──────────────────────── */
      .skeleton {
        display: inline-block;
        height: 13px;
        border-radius: 4px;
        background: linear-gradient(
          90deg,
          var(--wk-color-surface-alt, #f6f7f8) 25%,
          var(--wk-color-surface-raised, #eff0f1) 50%,
          var(--wk-color-surface-alt, #f6f7f8) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s infinite;
      }

      @keyframes skeleton-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* ── Paginador ───────────────────────────────── */
      .table-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px 12px;
        border-top: 1px solid var(--wk-color-border, #e2e8ea);
        background: var(--wk-color-surface-alt, #f6f7f8);
        min-height: 48px;
      }

      /* Selector de filas por página */
      .page-size {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8125rem;
        color: var(--wk-color-on-surface-muted, #546e7a);
        white-space: nowrap;
      }

      .page-size-select {
        height: 30px;
        padding: 0 24px 0 8px;
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-radius: var(--wk-radius-md, 6px);
        background-color: var(--wk-color-surface, #ffffff);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23546e7a' d='M1.41 0 6 4.58 10.59 0 12 1.41l-6 6-6-6L1.41 0z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 7px center;
        color: var(--wk-color-on-surface, #37474f);
        font-size: 0.8125rem;
        font-family: inherit;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        outline: none;
        transition: border-color var(--wk-transition-normal, 0.15s ease);
      }

      .page-size-select:focus {
        border-color: var(--wk-color-focus, #2772cc);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--wk-color-focus, #2772cc) 18%, transparent);
      }

      /* Texto 1-10 de 50 */
      .page-info {
        font-size: 0.8125rem;
        color: var(--wk-color-on-surface-muted, #546e7a);
        white-space: nowrap;
      }

      .page-info strong {
        color: var(--wk-color-on-surface, #37474f);
        font-weight: 600;
      }

      /* Botones de navegación */
      .page-nav {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .page-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border: 1px solid var(--wk-color-border, #e2e8ea);
        border-radius: var(--wk-radius-md, 6px);
        background: var(--wk-color-surface, #ffffff);
        color: var(--wk-color-on-surface, #37474f);
        cursor: pointer;
        font-family: inherit;
        transition:
          background var(--wk-transition-normal, 0.15s ease),
          border-color var(--wk-transition-normal, 0.15s ease);
        outline: none;
      }

      .page-btn .material-icons { font-size: 18px; }

      .page-btn:hover:not(:disabled) {
        background: var(--wk-color-surface-raised, #eff0f1);
        border-color: var(--wk-color-border-strong, #546e7a);
      }

      .page-btn:focus-visible {
        border-color: var(--wk-color-focus, #2772cc);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--wk-color-focus, #2772cc) 18%, transparent);
      }

      .page-btn:disabled {
        opacity: 0.35;
        cursor: default;
        pointer-events: none;
      }

      .page-btn--active {
        background: var(--wk-color-action, #28892b);
        border-color: var(--wk-color-action, #28892b);
        color: #ffffff;
        font-weight: 600;
        font-size: 0.8125rem;
        width: auto;
        padding: 0 10px;
        pointer-events: none;
      }
    `
  ];

  // ── Propiedades públicas ─────────────────────────────────────────
  /** Definición de columnas. */
  @property({ type: Array, attribute: false }) columns: TableColumn[] = [];
  /** Filas de datos. */
  @property({ type: Array, attribute: false }) rows: Row[] = [];
  /** Nombre del campo que actúa como clave única. */
  @property({ attribute: 'row-key' }) rowKey = 'id';
  /** Activa la columna de checkbox de selección. */
  @property({ type: Boolean }) selectable = false;
  /** Muestra el paginador. */
  @property({ type: Boolean }) paginated = false;
  /** Página inicial (1-based). */
  @property({ type: Number }) page = 1;
  /** Número de filas por página. */
  @property({ attribute: 'page-size', type: Number }) pageSize = 10;
  /** Opciones del selector de tamaño de página. */
  @property({ type: Array, attribute: false }) pageSizeOptions: number[] = [10, 25, 50, 100];
  /**
   * Modo server-side: el componente muestra el paginador y emite `ui-page`
   * pero NO corta el array `rows`. El host actualiza `rows` y `totalItems`
   * externamente.
   */
  @property({ type: Boolean, attribute: 'server-pagination' }) serverPagination = false;
  /**
   * Total de ítems para la visualización "1-10 de N".
   * En modo client-side se ignora (se usa rows.length).
   */
  @property({ type: Number, attribute: 'total-items' }) totalItems?: number;
  /** Muestra filas skeleton mientras carga. */
  @property({ type: Boolean }) loading = false;
  /** Número de filas skeleton en estado loading. */
  @property({ type: Number, attribute: 'skeleton-rows' }) skeletonRows = 5;
  /** Mensaje cuando no hay filas. */
  @property({ attribute: 'empty-message' }) emptyMessage = 'No hay datos para mostrar';
  /**
   * Claves preseleccionadas al inicializar el componente.
   * Escucha los cambios de propiedad para sincronizar la selección interna.
   */
  @property({ type: Array, attribute: false })
  set selectedKeys(val: string[]) {
    this._selectedSet = new Set(val);
    this.requestUpdate('selectedKeys');
  }
  get selectedKeys(): string[] {
    return [...this._selectedSet];
  }

  // ── Estado interno ───────────────────────────────────────────────
  @state() private _sortKey   = '';
  @state() private _sortDir: 'asc' | 'desc' = 'asc';
  @state() private _page      = 1;
  @state() private _pageSize  = 10;
  @state() private _selectedSet: Set<string> = new Set();

  @query('.select-all-check')
  private _selectAllCheckEl?: HTMLInputElement;

  // ── Sync desde props ─────────────────────────────────────────────
  override willUpdate(changed: PropertyValues): void {
    if (changed.has('page'))     this._page     = this.page;
    if (changed.has('pageSize')) this._pageSize = this.pageSize;
    // Al cambiar filas en modo client-side, volver a página 1
    if (changed.has('rows') && !this.serverPagination) {
      this._page = 1;
    }
  }

  override updated(): void {
    // Indeterminate no se puede setear con atributos HTML — requiere propiedad JS
    if (this._selectAllCheckEl) {
      this._selectAllCheckEl.indeterminate = this._indeterminate;
    }
  }

  // ── Getters computados ───────────────────────────────────────────
  private get _effectiveTotal(): number {
    if (this.serverPagination && this.totalItems !== undefined) return this.totalItems;
    return this.rows.length;
  }

  private get _totalPages(): number {
    return Math.max(1, Math.ceil(this._effectiveTotal / this._pageSize));
  }

  private get _sortedRows(): Row[] {
    if (!this._sortKey || this.serverPagination) return this.rows;
    return [...this.rows].sort((a, b) => {
      const av = a[this._sortKey] ?? '';
      const bv = b[this._sortKey] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return this._sortDir === 'asc' ? cmp : -cmp;
    });
  }

  private get _displayedRows(): Row[] {
    if (this.serverPagination) return this.rows;
    const start = (this._page - 1) * this._pageSize;
    return this._sortedRows.slice(start, start + this._pageSize);
  }

  /** Rango "start-end de total". */
  private get _rangeStart(): number {
    return this._effectiveTotal === 0 ? 0 : (this._page - 1) * this._pageSize + 1;
  }
  private get _rangeEnd(): number {
    return Math.min(this._page * this._pageSize, this._effectiveTotal);
  }

  // ── Selección ────────────────────────────────────────────────────
  private get _allSelected(): boolean {
    return this._displayedRows.length > 0 &&
      this._displayedRows.every(r => this._selectedSet.has(String(r[this.rowKey])));
  }

  private get _someSelected(): boolean {
    return this._displayedRows.some(r => this._selectedSet.has(String(r[this.rowKey])));
  }

  private get _indeterminate(): boolean {
    return this._someSelected && !this._allSelected;
  }

  private _toggleSelectAll(): void {
    if (this._allSelected) {
      this._displayedRows.forEach(r => this._selectedSet.delete(String(r[this.rowKey])));
    } else {
      this._displayedRows.forEach(r => this._selectedSet.add(String(r[this.rowKey])));
    }
    this._selectedSet = new Set(this._selectedSet); // trigger reactivity
    this._emitSelect();
  }

  private _toggleRow(key: string): void {
    if (this._selectedSet.has(key)) {
      this._selectedSet.delete(key);
    } else {
      this._selectedSet.add(key);
    }
    this._selectedSet = new Set(this._selectedSet);
    this._emitSelect(key);
  }

  // ── Ordenamiento ─────────────────────────────────────────────────
  private _handleSort(col: TableColumn): void {
    if (!col.sortable) return;
    if (this._sortKey === col.key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortKey = col.key;
      this._sortDir = 'asc';
    }
    this._page = 1;
    this._emit<TableSortDetail>('ui-sort', { key: this._sortKey, direction: this._sortDir });
  }

  // ── Paginación ───────────────────────────────────────────────────
  private _goTo(page: number): void {
    if (page < 1 || page > this._totalPages || page === this._page) return;
    this._page = page;
    this._emitPage();
  }

  private _onPageSizeChange(e: Event): void {
    const val = parseInt((e.target as HTMLSelectElement).value, 10);
    this._pageSize = val;
    this._page = 1;
    this._emitPage();
  }

  // ── Emisión de eventos ────────────────────────────────────────────
  private _emit<T>(name: string, detail: T): void {
    this.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: true, composed: true }));
  }

  private _emitSelect(triggerKey?: string): void {
    this._emit<TableSelectDetail>('ui-select', {
      selectedKeys: [...this._selectedSet],
      allSelected: this._allSelected,
      triggerKey,
    });
  }

  private _emitPage(): void {
    this._emit<TablePageDetail>('ui-page', {
      page: this._page,
      pageSize: this._pageSize,
      totalItems: this._effectiveTotal,
      totalPages: this._totalPages,
    });
  }

  // ── Render helpers ───────────────────────────────────────────────
  private _renderSortIcon(col: TableColumn) {
    if (!col.sortable) return nothing;
    const active = this._sortKey === col.key;
    const icon = active
      ? (this._sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward')
      : 'unfold_more';
    return html`<span class="material-icons sort-icon">${icon}</span>`;
  }

  private _renderHeaderRow() {
    return html`
      <tr>
        ${this.selectable ? html`
          <th class="col-check">
            <input
              type="checkbox"
              class="select-all-check"
              .checked=${live(this._allSelected)}
              ?disabled=${this.loading || this._displayedRows.length === 0}
              aria-label="Seleccionar todas las filas visibles"
              @change=${this._toggleSelectAll}
            />
          </th>
        ` : nothing}
        ${this.columns.map(col => html`
          <th
            class=${classMap({
              sortable:     !!col.sortable,
              'sort-active': this._sortKey === col.key,
              'th-center':  col.align === 'center',
              'th-right':   col.align === 'right',
            })}
            style=${ifDefined(col.width ? `width:${col.width}` : undefined)}
            @click=${() => this._handleSort(col)}
            aria-sort=${this._sortKey === col.key
              ? (this._sortDir === 'asc' ? 'ascending' : 'descending')
              : 'none'}
          >
            <span class="th-inner">
              ${col.label}
              ${this._renderSortIcon(col)}
            </span>
          </th>
        `)}
      </tr>
    `;
  }

  private _renderSkeletonRows() {
    return Array.from({ length: this.skeletonRows }, (_, i) => html`
      <tr>
        ${this.selectable ? html`<td class="col-check"></td>` : nothing}
        ${this.columns.map(() => html`
          <td>
            <span class="skeleton" style="width:${55 + ((i * 17) % 35)}%"></span>
          </td>
        `)}
      </tr>
    `);
  }

  private _renderDataRows() {
    if (this._displayedRows.length === 0) {
      const colSpan = this.columns.length + (this.selectable ? 1 : 0);
      return html`
        <tr>
          <td class="empty-cell" colspan=${colSpan}>
            <div class="material-icons empty-icon">inbox</div>
            <div class="empty-text">${this.emptyMessage}</div>
          </td>
        </tr>
      `;
    }

    return repeat(
      this._displayedRows,
      row => row[this.rowKey],
      row => {
        const key = String(row[this.rowKey]);
        const selected = this._selectedSet.has(key);
        return html`
          <tr
            class=${classMap({ 'row--selected': selected })}
            @click=${this.selectable ? () => this._toggleRow(key) : nothing}
            style=${this.selectable ? 'cursor:pointer' : ''}
          >
            ${this.selectable ? html`
              <td class="col-check" @click=${(e: Event) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  .checked=${live(selected)}
                  aria-label="Seleccionar fila"
                  @change=${() => this._toggleRow(key)}
                />
              </td>
            ` : nothing}
            ${this.columns.map(col => {
              const raw = row[col.key] ?? '';
              const display = col.formatter ? col.formatter(raw, row) : String(raw);
              return html`
                <td class=${classMap({
                  'td-center': col.align === 'center',
                  'td-right':  col.align === 'right',
                })}>${display}</td>
              `;
            })}
          </tr>
        `;
      }
    );
  }

  private _renderPaginator() {
    const canPrev = this._page > 1;
    const canNext = this._page < this._totalPages;

    return html`
      <div class="table-footer" part="footer">

        <!-- Selector de filas por página -->
        <div class="page-size">
          <span>Filas por página:</span>
          <select
            class="page-size-select"
            aria-label="Filas por página"
            @change=${this._onPageSizeChange}
          >
            ${this.pageSizeOptions.map(opt => html`
              <option value=${opt} ?selected=${opt === this._pageSize}>${opt}</option>
            `)}
          </select>
        </div>

        <!-- Rango "1-10 de 50" -->
        <div class="page-info" aria-live="polite">
          <strong>${this._rangeStart}–${this._rangeEnd}</strong>
          &nbsp;de&nbsp;
          <strong>${this._effectiveTotal}</strong>
        </div>

        <!-- Prev / Página actual / Next -->
        <div class="page-nav">
          <button
            class="page-btn"
            ?disabled=${!canPrev}
            aria-label="Página anterior"
            @click=${() => this._goTo(this._page - 1)}
          >
            <span class="material-icons">chevron_left</span>
          </button>

          <button class="page-btn page-btn--active" aria-current="page">
            ${this._page} / ${this._totalPages}
          </button>

          <button
            class="page-btn"
            ?disabled=${!canNext}
            aria-label="Página siguiente"
            @click=${() => this._goTo(this._page + 1)}
          >
            <span class="material-icons">chevron_right</span>
          </button>
        </div>

      </div>
    `;
  }

  override render() {
    return html`
      <div class="table-root" part="root">
        <div class="table-scroll">
          <table part="table" role="grid">
            <thead>
              ${this._renderHeaderRow()}
            </thead>
            <tbody>
              ${this.loading
                ? this._renderSkeletonRows()
                : this._renderDataRows()}
            </tbody>
          </table>
        </div>

        ${this.paginated ? this._renderPaginator() : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-table': UiTable;
  }
}
