import { Component, HostBinding, Input } from '@angular/core';
import '@design-lib/web-components/alert';

export type AlertType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

/**
 * Wrapper Angular para el web component <ui-alert>.
 *
 * El selector coincide con el tag del web component intencionalmente:
 * Angular gestiona los @Input y los reenvía al elemento DOM como atributos
 * via @HostBinding. Lit observa esos atributos y re-renderiza su shadow DOM.
 * <ng-content> proyecta el contenido como light DOM, que Lit expone via <slot>.
 *
 * Uso:
 *   <ui-alert [type]="'SUCCESS'">Operación completada.</ui-alert>
 *   <ui-alert type="ERROR" [noBackground]="true">Error al procesar.</ui-alert>
 */
@Component({
  selector: 'ui-alert',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class UiAlertComponent {
  @Input() type: AlertType = 'INFO';
  @Input() noBackground = false;

  @HostBinding('attr.type')
  get _attrType() { return this.type; }

  @HostBinding('attr.no-background')
  get _attrNoBackground() { return this.noBackground || null; }
}
