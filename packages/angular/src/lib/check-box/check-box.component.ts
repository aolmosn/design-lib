import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  NgZone,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { CheckBoxChangeDetail } from '@aolmosn/web-components/check-box';
import '@aolmosn/web-components/check-box';

/**
 * Wrapper Angular de <ui-check-box>.
 *
 * Compatible con Reactive Forms y ngModel. El valor del control es boolean.
 *
 * Ejemplo con formControlName:
 *   <ui-check-box formControlName="aceptar" label="Acepto los términos"></ui-check-box>
 *
 * Ejemplo con ngModel:
 *   <ui-check-box [(ngModel)]="aceptado" label="Acepto los términos"></ui-check-box>
 *
 */
@Component({
  selector: 'ui-check-box',
  standalone: true,
  template: `<ng-content></ng-content>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckBoxComponent),
      multi: true,
    },
  ],
})
export class UiCheckBoxComponent implements ControlValueAccessor, AfterViewInit {
  constructor(
    private _el: ElementRef,
    private _zone: NgZone,
    private _cdr: ChangeDetectorRef,
  ) {}

  @Input() label          = '';
  @Input() name           = '';
  @Input() required       = false;
  @Input() indeterminado  = false;

  private _isDisabled = false;

  @HostBinding('attr.label')         get _attrLabel()         { return this.label         || null; }
  @HostBinding('attr.name')          get _attrName()          { return this.name          || null; }
  @HostBinding('attr.required')      get _attrRequired()      { return this.required      ? '' : null; }
  @HostBinding('attr.indeterminado') get _attrIndeterminado() { return this.indeterminado ? '' : null; }
  private _onChange: (value: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    const el = this._el.nativeElement;

    el.addEventListener('ui-change', (e: Event) => {
      this._zone.run(() => {
        this._onChange((e as CustomEvent<CheckBoxChangeDetail>).detail.checked);
        this._cdr.markForCheck();
      });
    });

    el.addEventListener('ui-blur', () => {
      this._zone.run(() => {
        this._onTouched();
        this._cdr.markForCheck();
      });
    });
  }

  // ── ControlValueAccessor ─────────────────────────────────────────

  writeValue(value: boolean): void {
    this._el.nativeElement.checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
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
}
