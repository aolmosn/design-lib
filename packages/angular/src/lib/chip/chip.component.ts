import { Component, HostBinding, Input, input } from "@angular/core";
import '@design-lib/web-components/chip';

@Component({
  selector: 'ui-chip',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    '[attr.variant]': 'variant()',
    '[attr.size]': 'size()',
    '[attr.color]': 'color()'
  }
})
export class UiChip {
  variant= input<'filled' | 'outlined'>('filled');
  size= input<'small' | 'medium'>('small');
  color= input<'default' | 'success' | 'info' | 'warning' | 'error' >('default');
  @Input() clickeable = false;

  @HostBinding('attr.clickeable')
  get isActivo() {
    return this.clickeable ? '' : null; 
  }
}