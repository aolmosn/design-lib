import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import '@design-lib/web-components/onboarding';
import type { OnboardingStep } from '@design-lib/web-components/onboarding';

export type { OnboardingStep };

@Component({
  selector: 'ui-onboarding',
  template: '<ng-content></ng-content>',
  standalone: true,
})
export class UiOnboarding implements AfterViewInit, OnChanges {
  constructor(private _el: ElementRef) {}

  @Input() steps: OnboardingStep[] = [];

  ngAfterViewInit(): void {
    this._el.nativeElement.steps = this.steps;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['steps'] && this._el?.nativeElement) {
      this._el.nativeElement.steps = this.steps;
    }
  }

  // ── API pública — delegan al elemento Lit ──────────────────────────

  start(): void { this._el.nativeElement.start(); }
  stop():  void { this._el.nativeElement.stop();  }
  next():  void { this._el.nativeElement.next();  }
  prev():  void { this._el.nativeElement.prev();  }
}
