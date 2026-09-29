import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ComponentSize, FieldChangeDetail } from '@design-lib/core';

/**
 * Wrapper Angular de <ui-text-input>.
 *
 * Compatible con Reactive Forms y ngModel.
 *
 * Ejemplo con formControlName:
 *   <ui-text-field formControlName="email" label="Correo"></ui-text-field>
 *
 * Ejemplo con ngModel:
 *   <ui-text-field [(ngModel)]="email" label="Correo"></ui-text-field>
 */
@Component({
  selector: 'ui-text-field',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ui-text-input
      #inputEl
      [attr.label]="label"
      [attr.name]="name || null"
      [attr.placeholder]="placeholder || null"
      [attr.helper-text]="helperText || null"
      [attr.error-text]="_showError ? errorText : null"
      [attr.size]="size !== 'md' ? size : null"
      [attr.disabled]="_isDisabled ? '' : null"
      [attr.required]="required ? '' : null"
      [attr.invalid]="_showError ? '' : null"
    ></ui-text-input>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextFieldComponent),
      multi: true,
    },
  ],
})
export class UiTextFieldComponent
  implements ControlValueAccessor, AfterViewInit, OnChanges
{
  constructor(
    private _el: ElementRef,
    private _zone: NgZone,
    private _cdr: ChangeDetectorRef,
  ) {}
  @Input() label = '';
  @Input() name = '';
  @Input() placeholder = '';
  @Input() helperText = '';
  @Input() errorText = '';
  @Input() required = false;
  @Input() size: ComponentSize = 'md';

  @ViewChild('inputEl', { static: true }) private _inputEl!: ElementRef;

  protected _isDisabled = false;
  protected _showError = false;
  private _pendingValue: string | null = null;

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    const el = this._inputEl.nativeElement;

    el.addEventListener('ui-input', (e: Event) => {
      this._zone.run(() => {
        this._onChange((e as CustomEvent<FieldChangeDetail>).detail.value);
        this._cdr.markForCheck();
      });
    });

    el.addEventListener('ui-blur', () => {
      this._zone.run(() => {
        this._onTouched();
        this._cdr.markForCheck();
      });
    });

    if (this._pendingValue !== null) {
      this._setNativeValue(this._pendingValue);
      this._pendingValue = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('errorText' in changes) {
      this._showError = Boolean(this.errorText);
    }
  }

  // ── ControlValueAccessor ─────────────────────────────────────────

  writeValue(value: string): void {
    const v = value ?? '';
    if (this._inputEl?.nativeElement) {
      this._setNativeValue(v);
    } else {
      this._pendingValue = v;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._isDisabled = isDisabled;
    const el: HTMLElement = this._el.nativeElement;
    if (isDisabled) {
      el.setAttribute('disabled', '');
    } else {
      el.removeAttribute('disabled');
    }
    this._cdr.markForCheck();
  }

  private _setNativeValue(value: string): void {
    (this._inputEl.nativeElement as { value: string }).value = value;
  }
}
