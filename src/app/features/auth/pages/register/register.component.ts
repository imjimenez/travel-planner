import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/authentication';
import { NotificationService } from '../../../../core/notifications/notification.service';

/**
 * Componente de registro de nuevos usuarios
 * 
 * Permite crear una cuenta mediante:
 * - Email, contraseña y nombre completo (formulario tradicional)
 * - OAuth con Google, GitHub o Apple
 * 
 * Características:
 * - Validación personalizada de fortaleza de contraseña
 * - Validación de coincidencia de contraseñas
 * - Indicador visual de fortaleza de contraseña
 * - Toggle para mostrar/ocultar contraseñas
 * - Redirección automática al dashboard tras registro exitoso
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  /** Formulario reactivo de registro */
  registerForm: FormGroup;

  /** Indica si hay una operación de registro en curso */
  loading = false;

  /** Controla la visibilidad del campo de contraseña */
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Inicializa el formulario con validaciones
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /** Alterna la visibilidad del campo de contraseña */
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Maneja el envío del formulario de registro
   * 
   * 1. Valida el formulario completo
   * 3. Llama al servicio de autenticación
   * 4. Muestra notificación de éxito/error
   * 5. Redirige al dashboard si es exitoso
   */
  async onSubmit() {
    // Validación con feedback específico
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      // Mensajes de error específicos
      if (this.firstName?.invalid) {
        this.notificationService.error('El nombre debe tener al menos 2 caracteres');
        return;
      }
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
      
      const formValue = this.registerForm.value;
      
      // Estructurar credentials para el servicio
      const credentials = {
        email: formValue.email,
        password: formValue.password,
        fullName: formValue.firstName // El nombre se envía como fullName
      };

      const response = await this.authService.signUp(credentials);

      if (response.error) {
        this.notificationService.error(response.error);
      } else if (response.user) {

        // Verifica si necesita confirmación de email
        if (!response.session) {
          this.notificationService.success('Cuenta creada. Revisa tu email para confirmar tu dirección de correo.');
          this.router.navigate(['/auth/login']);
        } else {
          this.notificationService.success('Cuenta creada, !Bienvenido!');
          this.router.navigate(['/dashboard']);
        }

        
      } else {
        this.notificationService.error('Error desconocido al crear la cuenta');
      }
    } catch (error) {
      this.notificationService.error('Error inesperado al crear la cuenta');
    } finally {
      this.loading = false
    }
  }

  /**
   * Inicia el flujo de registro con Google
   * Redirige automáticamente a la página de login de Google
   */
  async onGoogleSignup() {
    this.loading = true;
    const result = await this.authService.signInWithGoogle();
    
    if (result.error) {
      this.notificationService.error(result.error);
      this.loading = false;
    }
    // Si no hay error, el navegador redirige automáticamente
  }

  /**
   * Inicia el flujo de registro con GitHub
   * Redirige automáticamente a la página de autorización de GitHub
   */
  async onGitHubSignup() {
    this.loading = true;
    const result = await this.authService.signInWithGitHub();
    
    if (result.error) {
      this.notificationService.error(result.error);
      this.loading = false;
    }
    // Si no hay error, el navegador redirige automáticamente
  }

  /**
   * Inicia el flujo de registro con Apple
   * Redirige automáticamente a Sign in with Apple
   */
  async onAppleSignup() {
    this.loading = true;
    const result = await this.authService.signInWithApple();
    
    if (result.error) {
      this.notificationService.error(result.error);
      this.loading = false;
    }
    // Si no hay error, el navegador redirige automáticamente
  }

  // Getters para acceder fácilmente a los controles del formulario en el template
  get firstName() {
    return this.registerForm.get('fullName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

}
