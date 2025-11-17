import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/authentication';
import { NotificationService } from '../../../../core/notifications/notification.service';

/**
 * Componente de inicio de sesión
 * 
 * Permite a los usuarios autenticarse mediante:
 * - Email y contraseña (formulario tradicional)
 * - OAuth con Google, GitHub o Apple
 * 
 * Características:
 * - Validación de formularios en tiempo real
 * - Toggle para mostrar/ocultar contraseña
 * - Feedback visual mediante notificaciones toast
 * - Redirección automática al dashboard tras login exitoso
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  /** Formulario reactivo de login */
  loginForm: FormGroup;

  /** Indica si hay una operación de login en curso */
  loading = false;

  /** Controla la visibilidad de la contraseña */
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Inicializa el formulario con validaciones
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /** Alterna la visibilidad de la contraseña */
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Maneja el envío del formulario de login con email/password
   * 
   * 1. Valida el formulario
   * 2. Llama al servicio de autenticación
   * 3. Muestra notificación de éxito/error
   * 4. Redirige al dashboard si es exitoso
   */
  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      // Mensajes de error específicos
      if (this.email?.invalid) {
        this.notificationService.error('Por favor, introduce un email válido');
        return;
      }
      if (this.password?.invalid) {
        this.notificationService.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      this.notificationService.error('Por favor, completa todos los campos correctamente');
      return;
    }

    this.loading = true;

    try {
      const credentials = this.loginForm.value;
      const response = await this.authService.signIn(credentials);

      if (response.error) {
        this.notificationService.error(response.error);
      } else if (response.user) {
        this.notificationService.success('¡Bienvenido de vuelta!');
        this.router.navigate(['/dashboard']);
      } else {
        this.notificationService.error('Error desconocido al iniciar sesión');
      }
    } catch (error) {
      this.notificationService.error('Error inesperado al iniciar sesión');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Inicia el flujo de autenticación con Google
   * Redirige automáticamente a la página de login de Google
   */
  async onGoogleLogin() {
    this.loading = true;
    const result = await this.authService.signInWithGoogle();

    if (result.error) {
      this.notificationService.error(result.error);
      this.loading = false;
    }
    // Si no hay error, el navegador redirige automáticamente
  }

  /**
   * Inicia el flujo de autenticación con GitHub
   * Redirige automáticamente a la página de autorización de GitHub
   */
  async onGitHubLogin() {
    this.loading = true;
    const result = await this.authService.signInWithGitHub();

    if (result.error) {
      this.notificationService.error(result.error);
      this.loading = false;
    }
    // Si no hay error, el navegador redirige automáticamente
  }

  /**
   * Inicia el flujo de autenticación con Apple
   * Redirige automáticamente a Sign in with Apple
   */
  async onAppleLogin() {
    this.loading = true;
    const result = await this.authService.signInWithApple();
    
    if (result.error) {
      this.notificationService.error(result.error);
      this.loading = false;
    }
    // Si no hay error, el navegador redirige automáticamente
  }

  // Getters para acceder fácilmente a los controles del formulario en el template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
