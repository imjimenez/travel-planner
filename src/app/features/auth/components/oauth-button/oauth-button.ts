import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-oauth-button',
  imports: [ButtonModule],
  template: `
    <p-button
      [disabled]="disabled()"
      (onClick)="handleOAuth.emit()"
      variant="outlined"
      class="flex items-center justify-center px-4 py-3 rounded-lg transition-all"
      [icon]="'pi pi-' + provider()"
      size="large"
    >
    </p-button>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OAuthButton {
  provider = input.required<string>();
  disabled = input<boolean>();

  handleOAuth = output<void>();
}
