import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	output,
} from "@angular/core";
import {
	type AbstractControl,
	FormBuilder,
	ReactiveFormsModule,
	type ValidationErrors,
	Validators,
} from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";

@Component({
	selector: "app-reset-password-form",
	imports: [
		ReactiveFormsModule,
		InputTextModule,
		InputGroupModule,
		InputGroupAddonModule,
		ButtonModule,
		MessageModule,
	],
	template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <div class="space-y-2">
        <label for="newPassword" class="block text-sm font-medium text-gray-700"> Nueva contraseña </label>
        <p-inputgroup class="relative">
          <input pInputText id="newPassword" [type]="showPassword ? 'text' : 'password'" formControlName="newPassword" placeholder="Tu contraseña" required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none pr-12"/>
          <p-inputgroup-addon>
              <p-button (click)="showPassword = !showPassword" [icon]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" severity="secondary" />
          </p-inputgroup-addon>
        </p-inputgroup>
        @if (form.controls.newPassword.errors && form.controls.newPassword.touched) {
          @if(form.controls.newPassword.errors['required']) {
            <p-message severity="error" size="small" variant="simple">Contraseña es requerida</p-message>
          }
          @else if(form.controls.newPassword.errors['minlength']) {
            <p-message severity="error" size="small" variant="simple">Contraseña debe tener al menos 6 caracteres</p-message>
          }
          @else{
            <p-message severity="error" size="small" variant="simple">Contraseña no válida</p-message>
          }
        }
      </div>


      <div class="space-y-2">
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700"> Confirmar contraseña </label>
        <p-inputgroup class="relative">
          <input pInputText id="confirmPassword" [type]="showConfirmPassword ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Confirmar contraseña" required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none pr-12"/>
          <p-inputgroup-addon>
              <p-button (click)="showConfirmPassword = !showConfirmPassword" [icon]="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" severity="secondary" />
          </p-inputgroup-addon>
        </p-inputgroup>
        @if (form.controls.confirmPassword.errors && form.controls.confirmPassword.touched) {
          @if(form.controls.confirmPassword.errors['required']) {
            <p-message severity="error" size="small" variant="simple">Contraseña es requerida</p-message>
          }
          @else if(form.controls.confirmPassword.errors['minlength']) {
            <p-message severity="error" size="small" variant="simple">Contraseña debe tener al menos 6 caracteres</p-message>
          }
          @else{
            <p-message severity="error" size="small" variant="simple">Contraseña no válida</p-message>
          }
        }@else if(form.errors && form.touched && form.errors['passwordMismatch']) {
          <p-message severity="error" size="small" variant="simple">Las contraseñas no coinciden</p-message>
        }
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm font-medium text-gray-700 mb-2">La contraseña debe contener:</p>
        <ul class="text-sm text-gray-600 space-y-1">
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            Mínimo 6 caracteres
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            Al menos una letra mayúscula
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            Al menos un número
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            Al menos un carácter especial
          </li>
        </ul>
      </div>
      <p-button
        type="submit"
        [disabled]="form.invalid || loading()"
        styleClass="w-full py-3 rounded-lg font-medium transform hover:scale-[1.02] transition-all"
      >
        @if(loading()){
          <span class="pi pi-spin pi-spinner"></span>
        }@else{
          Cambiar contraseña
        }
      </p-button>
    </form>
  `,
	styles: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResetPasswordForm {
	#fb = inject(FormBuilder);

	loading = input.required<boolean>();
	resetPassword = output<string>();

	form = this.#fb.group(
		{
			newPassword: this.#fb.nonNullable.control("", [
				Validators.required,
				Validators.minLength(6),
			]),
			confirmPassword: this.#fb.nonNullable.control("", [
				Validators.required,
				Validators.minLength(6),
			]),
		},
		{ validators: [this.passwordMatchValidator] },
	);

	showPassword = false;
	showConfirmPassword = false;

	onSubmit() {
		if (this.form.valid && this.form.value.newPassword) {
			this.resetPassword.emit(this.form.value.newPassword);
		}
	}

	passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
		const newPassword = control.get("newPassword");
		const confirmPassword = control.get("confirmPassword");
		return newPassword &&
			confirmPassword &&
			newPassword.value !== confirmPassword.value
			? { passwordMismatch: true }
			: null;
	}
}
