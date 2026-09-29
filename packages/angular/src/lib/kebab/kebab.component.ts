import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  NgZone,
  forwardRef,
  input
} from '@angular/core';
import '@design-lib/web-components/kebab';

@Component({
  selector: 'ui-kebab-container',
  template: '<ng-content></ng-content>',
  standalone: true,
  styles: `
    :host {
    box-sizing: content-box;}
  `
})
export class UiKebab {
  


}