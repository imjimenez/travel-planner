import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { LoginCredentials } from '@core/authentication';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login-form',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    ButtonModule,
    MessageModule,
    RouterLink,
  ],
  template: `
    <!-- Form -->
    <form [formGroup]="loginForm" class="space-y-4" (ngSubmit)="onSubmit()">
      <!-- Email -->
      <div class="space-y-2">
        <label for="email" class="block text-sm font-medium text-gray-700"
          >Correo electrónico</label
        >
        <input
          pInputText
          id="email"
          type="email"
          formControlName="email"
          placeholder="tu@email.com"
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
        @if (loginForm.controls.email.errors && loginForm.controls.email.touched) {
        @if(loginForm.controls.email.errors['required']) {
        <p-message severity="error" size="small" variant="simple"
          >Correo electrónico es requerido</p-message
        >
        }@else{
        <p-message severity="error" size="small" variant="simple"
          >Correo electrónico no válido</p-message
        >
        } }
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
        <p-inputgroup class="relative">
          <input
            pInputText
            id="password"
            [type]="showPassword ? 'text' : 'password'"
            formControlName="password"
            placeholder="Tu contraseña"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none pr-12"
          />
          <p-inputgroup-addon>
            <p-button
              (click)="showPassword = !showPassword"
              [icon]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              severity="secondary"
            />
          </p-inputgroup-addon>
        </p-inputgroup>
        @if (loginForm.controls.password.errors && loginForm.controls.password.touched) {
        @if(loginForm.controls.password.errors['required']) {
        <p-message severity="error" size="small" variant="simple"
          >Contraseña es requerida</p-message
        >
        } @else if(loginForm.controls.password.errors['minlength']) {
        <p-message severity="error" size="small" variant="simple"
          >Contraseña debe tener al menos 6 caracteres</p-message
        >
        } @else{
        <p-message severity="error" size="small" variant="simple">Contraseña no válida</p-message>
        } }
      </div>
      <div class="text-right">
        <a
          routerLink="/auth/forgot-password"
          class="text-sm text-black hover:text-emerald-600 font-medium transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <!-- Submit -->
      <p-button
        type="submit"
        [disabled]="loginForm.invalid || loading()"
        styleClass="w-full  py-3 rounded-lg font-medium transform transition-all"
      >
        @if(loading()){
        <span class="pi pi-spin pi-spinner"></span>
        }@else{ Iniciar sesión }
      </p-button>
    </form>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginForm {
  #fb = inject(FormBuilder);
  loading = input.required<boolean>();
  doLogin = output<LoginCredentials>();

  loginForm = this.#fb.group({
    email: this.#fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.#fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
  });

  /** Controla la visibilidad de la contraseña */
  showPassword = false;

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }
    this.doLogin.emit(this.loginForm.getRawValue());
  }

  disableForm = effect(() => {
    if (this.loading()) this.loginForm.disable();
    else this.loginForm.enable();
  });
}
