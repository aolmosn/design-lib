import { Component, HostBinding, Input } from "@angular/core";
import '@aolmosn/web-components/button';

export type ButtonType = 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'LINK' | 'QUINARY';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class UiButton {
  @Input() type: ButtonType = 'PRIMARY';
  @Input() disabled = false;
  @Input() expanded = false;
  @Input() rigthIcon = '';
  @Input() leftIcon = '';

  @HostBinding('attr.disabled') get _attrDisabled() { return this.disabled ? '' : null; }
  @HostBinding('attr.expanded') get _attrExpanded() { return this.expanded ? '' : null; }
  @HostBinding('attr.type')     get _attrType()     { return this.type; }
  @HostBinding('attr.rigthIcon') get _attrRigthIcon() { return this.rigthIcon; }
  @HostBinding('attr.leftIcon') get _attrLeftIcon() { return this.leftIcon; }
}