import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-forgot-password-form',
  imports: [ReactiveFormsModule, InputTextModule, MessageModule, ButtonModule],
  template: `
    <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-4">
      <div class="space-y-2">
        <label for="email" class="block text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <input
          pInputText
          id="email"
          type="email"
          formControlName="email"
          placeholder="tu@email.com"
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
        @if (forgotForm.controls.email.errors && forgotForm.controls.email.touched) {
        @if(forgotForm.controls.email.errors['required']) {
        <p-message severity="error" size="small" variant="simple"
          >Correo electrónico es requerido</p-message
        >
        }@else{
        <p-message severity="error" size="small" variant="simple"
          >Correo electrónico no válido</p-message
        >
        } }
      </div>

      <p-button
        type="submit"
        [disabled]="forgotForm.invalid || loading()"
        styleClass="w-full py-3 rounded-lg font-medium transform transition-all"
      >
        @if(loading()){
        <span class="pi pi-spin pi-spinner"></span>
        }@else{ Enviar enlace de recuperación }
      </p-button>
    </form>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ForgotPasswordForm {
  #fb = inject(FormBuilder);
  loading = input.required<boolean>();
  onSendEmail = output<string>();

  forgotForm = this.#fb.group({
    email: this.#fb.nonNullable.control('', [Validators.required, Validators.email]),
  });

  onSubmit() {
    if (this.forgotForm.valid && this.forgotForm.value.email) {
      this.onSendEmail.emit(this.forgotForm.value.email);
    }
  }

  disableForm = effect(() => {
    if (this.loading()) this.forgotForm.disable();
    else this.forgotForm.enable();
  });
}
