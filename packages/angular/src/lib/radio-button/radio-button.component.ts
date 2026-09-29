import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, forwardRef, HostBinding, Input, NgZone } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { RadioButtonChangeDetail } from '@design-lib/web-components/radio-button';
import '@design-lib/web-components/radio-button';

@Component({
  selector: 'ui-radio-button',
  standalone: true,
  template: `<ng-content></ng-content>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiRadioButtonComponent),
      multi: true,
    },
  ],
})
export class UiRadioButtonComponent implements ControlValueAccessor, AfterViewInit {
  constructor(
    private _el: ElementRef,
    private _zone: NgZone,
    private _cdr: ChangeDetectorRef,
  ) {}

  @Input() label    = '';
  @Input() name     = '';
  @Input() value    = 'on';
  @Input() required = false;

  private _isDisabled = false;

  @HostBinding('attr.label')    get _attrLabel()    { return this.label    || null; }
  @HostBinding('attr.name')     get _attrName()     { return this.name     || null; }
  @HostBinding('attr.value')    get _attrValue()    { return this.value    || null; }
  @HostBinding('attr.required') get _attrRequired() { return this.required  ? '' : null; }
  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    const el = this._el.nativeElement;

    el.addEventListener('ui-change', (e: Event) => {
      this._zone.run(() => {
        this._uncheckSiblings();
        this._onChange((e as CustomEvent<RadioButtonChangeDetail>).detail.value);
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

  writeValue(formValue: string): void {
    const isSelected = (formValue === this.value);
    this._el.nativeElement.checked = isSelected;
    if (isSelected) {
      this._uncheckSiblings();
    }
  }

  private _uncheckSiblings(): void {
    if (!this.name) return;
    document
      .querySelectorAll<HTMLElement & { checked: boolean }>(`ui-radio-button[name="${this.name}"]`)
      .forEach(sibling => {
        if (sibling !== this._el.nativeElement) {
          sibling.checked = false;
        }
      });
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
}