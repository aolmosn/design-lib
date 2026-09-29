import { Component, input } from '@angular/core';
import '@design-lib/web-components/kebab';

@Component({
  selector: 'ui-kebab-option',
  template: '<ng-content></ng-content>',
  standalone: true,
  host: {
    '[attr.icon]': 'icon()'
  }
})
export class UiKebabOption {
  icon = input<string>('');
}