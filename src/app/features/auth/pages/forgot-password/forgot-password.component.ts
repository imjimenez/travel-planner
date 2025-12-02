import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/authentication';
import { NotificationService } from '../../../../core/notifications/notification.service';

/**
 * Componente de recuperación de contraseña
 *
 * Permite a los usuarios solicitar un email para resetear su contraseña
 * cuando la han olvidado.
 *
 * Flujo:
 * 1. Usuario ingresa su email
 * 2. Se envía un email con enlace mágico de recuperación
 * 3. Al hacer clic en el enlace, se redirige a /auth/reset-password
 * 4. Muestra confirmación visual de que el email fue enviado
 *
 * Estados:
 * - emailSent = false: Muestra formulario de solicitud
 * - emailSent = true: Muestra mensaje de confirmación
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  /** Formulario reactivo para capturar el email */
  forgotForm: FormGroup;

  /** Indica si hay una operación en curso */
  loading = false;

  /** Indica si el email de recuperación fue enviado con éxito */
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Formulario simple con solo email
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /**
   * Maneja el envío del formulario de recuperación
   *
   * 1. Valida que el email sea correcto
   * 2. Solicita el email de recuperación al servicio
   * 3. Muestra notificación y cambia el estado a "emailSent"
   * 4. El usuario puede reenviar el email si no lo recibió
   */
  async onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email } = this.forgotForm.value;
    const response = await this.authService.resetPassword(email);

    if (response.error) {
      this.notificationService.error(response.error);
      this.loading = false;
    } else {
      this.emailSent = true;
      this.notificationService.success('Email enviado. Revisa tu bandeja de entrada');
      this.loading = false;
    }
  }

  // Getter para acceder al control de email en el template
  get email() {
    return this.forgotForm.get('email');
  }

  /** Navega de vuelta a la página de login */
  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
