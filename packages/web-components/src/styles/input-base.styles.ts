import { css } from 'lit';

/**
 * Shared visual states for all input-type components (select, file, password, text, etc.).
 * Apply classes to the trigger/field container and its wrapper.
 *
 * Class API:
 *   .input-wrap         — outer column wrapper (label + field + helper)
 *   .input-label        — label element
 *   .input-field        — visible trigger / field container
 *   .input-value        — text when a value is set
 *   .input-placeholder  — text when no value (placeholder)
 *   .input-icon         — leading or trailing icon inside the field
 *   .input-helper       — helper text below
 *   .input-error-msg    — error message below (replaces helper when invalid)
 *
 * Modifier classes on .input-field:
 *   .input-field--focused   — active focus (set via JS when :focus-within isn't enough)
 *   .input-field--filled    — has a selected value
 *   .input-field--error     — invalid / validation failed
 *   .input-field--disabled  — non-interactive
 *   .input-field--readonly  — viewable but not editable
 */
export const inputBaseStyles = css`
  /* ── Wrapper ────────────────────────────────────────────────── */
  .input-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--wk-space-1, 4px);
    font-family: var(--wk-font-family, system-ui, sans-serif);
  }

  /* ── Label ──────────────────────────────────────────────────── */
  .input-label {
    display: block;
    font-size: var(--wk-font-size-b2, 0.8125rem);
    font-weight: var(--wk-font-weight-medium, 500);
    color: var(--wk-color-on-surface-muted, #546e7a);
    line-height: 1.25;
    user-select: none;
    transition: color var(--wk-transition-normal, 0.15s ease);
  }

  /* ── Field container (the visible trigger) ──────────────────── */
  .input-field {
    display: flex;
    align-items: center;
    gap: var(--wk-space-2, 8px);
    padding: 0 var(--wk-space-3, 12px);
    height: 40px;
    box-sizing: border-box;
    border: 1px solid var(--wk-color-border, #e2e8ea);
    border-radius: var(--wk-radius-md, 6px);
    background: var(--wk-color-surface, #ffffff);
    outline: none;
    transition:
      border-color var(--wk-transition-normal, 0.15s ease),
      box-shadow   var(--wk-transition-normal, 0.15s ease),
      background   var(--wk-transition-normal, 0.15s ease);
  }

  /* ── State: Hover ───────────────────────────────────────────── */
  .input-field:hover:not(.input-field--disabled):not(.input-field--readonly) {
    border-color: var(--wk-color-border-strong, #546e7a);
  }

  /* ── State: Focus ───────────────────────────────────────────── */
  /* --wk-color-focus (blue-500) is intentionally different from  */
  /* --wk-color-action (green-500). Blue = keyboard/a11y; green =  */
  /* confirmed interactive action.                                  */
  .input-field--focused,
  .input-field:focus-within:not(.input-field--disabled) {
    border-color: var(--wk-color-focus, #2772cc);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--wk-color-focus, #2772cc) 18%, transparent);
  }

  .input-wrap:has(.input-field--focused) .input-label,
  .input-wrap:has(.input-field:focus-within:not(.input-field--disabled)) .input-label {
    color: var(--wk-color-focus, #2772cc);
  }

  /* ── State: Error ───────────────────────────────────────────── */
  .input-field--error {
    border-color: var(--wk-color-border-error, #ed0c10);
    /* background: var(--wk-color-danger-subtle, #fbced1); */
  }

  .input-field--error:hover:not(.input-field--disabled) {
    border-color: var(--wk-color-border-error, #ed0c10);
  }

  .input-field--error.input-field--focused,
  .input-field--error:focus-within:not(.input-field--disabled) {
    border-color: var(--wk-color-border-error, #ed0c10);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--wk-color-danger, #ed0c10) 18%, transparent);
  }

  .input-wrap:has(.input-field--error) .input-label {
    color: var(--wk-color-danger, #ed0c10);
  }

  /* ── State: Disabled ────────────────────────────────────────── */
  .input-field--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  .input-wrap:has(.input-field--disabled) .input-label {
    opacity: 0.4;
  }

  /* ── State: Read-only ───────────────────────────────────────── */
  .input-field--readonly {
    background: var(--wk-color-surface-alt, #f6f7f8);
    cursor: default;
  }

  /* ── Text content ───────────────────────────────────────────── */
  .input-value {
    flex: 1;
    min-width: 0;
    font-size: var(--wk-font-size-b1, 0.875rem);
    color: var(--wk-color-on-surface, #37474f);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .input-placeholder {
    flex: 1;
    min-width: 0;
    font-size: var(--wk-font-size-b1, 0.875rem);
    color: var(--wk-color-on-surface-muted, #546e7a);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }

  /* ── Icon inside field ──────────────────────────────────────── */
  .input-icon {
    flex-shrink: 0;
    font-size: 1.125rem;
    line-height: 1;
    color: var(--wk-color-on-surface-muted, #546e7a);
    user-select: none;
    transition: color var(--wk-transition-normal, 0.15s ease);
  }

  .input-field--focused .input-icon,
  .input-field:focus-within .input-icon {
    color: var(--wk-color-focus, #2772cc);
  }

  .input-field--error .input-icon {
    color: var(--wk-color-danger, #ed0c10);
  }

  /* ── Helper / Error text ────────────────────────────────────── */
  .input-helper {
    font-size: var(--wk-font-size-b3, 0.8125rem);
    color: var(--wk-color-on-surface-muted, #546e7a);
    line-height: 1.25;
  }

  .input-error-msg {
    display: flex;
    align-items: center;
    gap: var(--wk-space-1, 4px);
    font-size: var(--wk-font-size-b3, 0.8125rem);
    color: var(--wk-color-danger, #ed0c10);
    line-height: 1.25;
  }
`;
