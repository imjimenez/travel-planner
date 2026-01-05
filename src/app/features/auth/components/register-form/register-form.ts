import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { SignUpCredentials } from '@core/authentication';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-register-form',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    ButtonModule,
    MessageModule,
    CheckboxModule,
  ],
  template: `
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
      <!-- Nombre completo -->
      <div class="space-y-2">
        <label for="fullName" class="block text-sm font-medium text-gray-700"
          >Nombre completo</label
        >
        <input
          pInputText
          id="fullName"
          type="text"
          formControlName="fullName"
          placeholder="Tu nombre completo"
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
        @if (registerForm.controls.fullName.errors && registerForm.controls.fullName.touched) {
        @if(registerForm.controls.fullName.errors['required']) {
        <p-message severity="error" size="small" variant="simple"
          >Nombre completo es requerido</p-message
        >
        } }
      </div>

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
        @if (registerForm.controls.email.errors && registerForm.controls.email.touched) {
        @if(registerForm.controls.email.errors['required']) {
        <p-message severity="error" size="small" variant="simple"
          >Correo electrónico es requerido</p-message
        >
        }@else{
        <p-message severity="error" size="small" variant="simple"
          >Correo electrónico no válido</p-message
        >
        } }
      </div>

      <!-- Contraseña -->
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
        @if (registerForm.controls.password.errors && registerForm.controls.password.touched) {
        @if(registerForm.controls.password.errors['required']) {
        <p-message severity="error" size="small" variant="simple"
          >Contraseña es requerida</p-message
        >
        } @else if(registerForm.controls.password.errors['minlength']) {
        <p-message severity="error" size="small" variant="simple"
          >Contraseña debe tener al menos 6 caracteres</p-message
        >
        } @else{
        <p-message severity="error" size="small" variant="simple">Contraseña no válida</p-message>
        } }
      </div>
      <div class="flex items-start gap-3">
        <p-checkbox formControlName="termsAndPrivacy" [binary]="true" inputId="termsAndPrivacy" />
        <label for="termsAndPrivacy" class="text-sm text-gray-600">
          Acepto los
          <a href="#" class="text-black hover:text-emerald-600 font-medium transition-colors">
            Términos de Servicio
          </a>
          y la
          <a href="#" class="text-back hover:text-emerald-700 font-medium transition-colors">
            Política de Privacidad
          </a>
        </label>
      </div>
      <div class="flex items-start gap-1">
        @if (registerForm.controls.termsAndPrivacy.errors &&
        registerForm.controls.termsAndPrivacy.touched) {
        @if(registerForm.controls.termsAndPrivacy.errors['required']) {
        <p-message severity="error" size="small" variant="simple"
          >Debe aceptar los términos y la política de privacidad</p-message
        >
        } }
      </div>
      <!-- Botón de submit -->
      <p-button
        type="submit"
        [disabled]="registerForm.invalid || loading()"
        styleClass="w-full space-y-2 py-3 rounded-lg font-medium transform transition-all"
      >
        @if(loading()){
        <span class="pi pi-spin pi-spinner"></span>
        }@else{ Crear cuenta }
      </p-button>
    </form>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RegisterForm {
  #fb = inject(FormBuilder);

  loading = input.required<boolean>();

  doRegister = output<SignUpCredentials>();

  registerForm = this.#fb.group({
    fullName: this.#fb.nonNullable.control('', [Validators.required]),
    email: this.#fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.#fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    termsAndPrivacy: this.#fb.nonNullable.control(false, [Validators.requiredTrue]),
  });

  showPassword = false;

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { fullName, email, password } = this.registerForm.getRawValue();
      this.doRegister.emit({ fullName, email, password });
    }
  }
}
