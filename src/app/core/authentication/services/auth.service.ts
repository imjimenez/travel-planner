import { Injectable } from '@angular/core';
import { SupabaseService } from '../../supabase/supabase.service';
import { 
  AuthResponse, 
  LoginCredentials, 
  SignUpCredentials,
  User,
  mapSupabaseUser
} from '../models';
import {
  AuthProvider,
  OAuthOptions,
  OAuthConfig,
  getRedirectURL
 } from '../providers';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio central de autenticación
 * 
 * Gestiona toda la lógica de autenticación de la aplicación usando Supabase Auth.
 * Proporciona métodos para:
 * - Login/registro con email y password
 * - Autenticación OAuth (Google, GitHub, Apple)
 * - Recuperación y cambio de contraseña
 * - Gestión de sesión y tokens
 * - Estado reactivo del usuario autenticado
 * 
 * IMPORTANTE: 
 * - El refresh de tokens es automático (gestionado por Supabase)
 * - El estado del usuario se mantiene sincronizado mediante Observables
 * - Todas las operaciones son asíncronas y retornan Promises
 * 
 * @example
 * constructor(private authService: AuthService) {
 *   // Suscribirse al estado del usuario
 *   this.authService.currentUser$.subscribe(user => {
 *     console.log('Usuario actual:', user);
 *   });
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // ==========================================
  // ESTADO REACTIVO
  // ==========================================

  /**
   * Subject que mantiene el usuario actual
   * Privado para evitar modificaciones externas
   */
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  /**
   * Observable público del usuario actual
   * Emite null cuando no hay usuario autenticado
   * 
   * @example
   * this.authService.currentUser$.subscribe(user => {
   *   if (user) {
   *     console.log('Usuario logueado:', user.email);
   *   }
   * });
   */
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  /**
   * Subject que indica si hay una operación de auth en curso
   * Útil para mostrar spinners/loaders en la UI
   */
  private loadingSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable del estado de carga
   * true = operación en curso, false = operación completada
   * 
   * @example
   * this.authService.loading$.subscribe(loading => {
   *   this.showSpinner = loading;
   * });
   */
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  /**
   * Constructor del servicio
   * Inicializa automáticamente el estado de autenticación
   */
  constructor(private supabaseService: SupabaseService) { 
    this.initializeAuth();
  }
  
  /**
   * Inicializa el sistema de autenticación
   * 
   * 1. Carga el usuario actual de la sesión de Supabase (si existe)
   * 2. Configura listener para cambios de estado (login, logout, refresh)
   * 
   * Se ejecuta automáticamente al arrancar la aplicación.
   * NO llamar manualmente.
   */
  private async initializeAuth() {
    // Intenta cargar usuario de la sesión existente (localStorage)
    const { data: { user } } = await this.supabaseService.auth.getUser();
    if (user) {
      const mappedUser = mapSupabaseUser(user);
      this.currentUserSubject.next(mappedUser);
    }

    // Listener para cambios de autenticación
    // Se dispara en: login, logout, refresh de token, etc.
    this.supabaseService.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? mapSupabaseUser(session.user) : null;
      this.currentUserSubject.next(user);
    })
  }

  // ==========================================
  // GETTERS
  // ==========================================

  /**
   * Obtiene el usuario actual de forma síncrona
   * 
   * @returns Usuario actual o null si no hay sesión
   * 
   * @example
   * const user = this.authService.currentUser;
   * if (user) {
   *   console.log(user.email);
   * }
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el access token actual
   * 
   * Supabase automáticamente refresca el token si ha expirado,
   * por lo que siempre retorna un token válido (si hay sesión activa).
   * 
   * Este método es usado internamente por el HTTP Interceptor
   * para añadir el token a todas las peticiones.
   * 
   * @returns Access token válido o null si no hay sesión
   * 
   * @example
   * const token = await this.authService.getAccessToken();
   * // Usar para peticiones HTTP manuales (normalmente no necesario)
   */
  async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await this.supabaseService.auth.getSession();
    return session?.access_token || null;
  }

  // ==========================================
  // AUTENTICACIÓN CON EMAIL/PASSWORD
  // ==========================================

  /**
   * Inicia sesión con email y contraseña
   * 
   * @param credentials - Email y password del usuario
   * @returns Promesa con usuario, sesión y posible error
   * 
   * @example
   * const response = await this.authService.signIn({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   * 
   * if (response.error) {
   *   console.error(response.error);
   * } else {
   *   console.log('Usuario logueado:', response.user);
   * }
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    this.loadingSubject.next(true);
    
    try {
      const { data, error } = await this.supabaseService.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        const translatedError = translateAuthError(error.message);
        return { user: null, session: null, error: translatedError}
      }

      const user = data.user ? mapSupabaseUser(data.user): null;

      // Actualiza el estado reactivo
      this.currentUserSubject.next(user);

      return {
        user,
        session: data.session ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0
        } : null,
        provider: 'email',
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      return {
        user: null,
        session: null,
        error: 'Error inesperado al iniciar sesión'
      }
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   * 
   * @param credentials - Email, password y datos adicionales (nombre)
   * @returns Promesa con usuario, sesión y posible error
   * 
   * IMPORTANTE: Dependiendo de la configuración de Supabase,
   * el usuario puede necesitar confirmar su email antes de poder hacer login.
   * 
   * @example
   * const response = await this.authService.signUp({
   *   email: 'nuevo@example.com',
   *   password: 'password123',
   *   fullName: 'Juan Pérez'
   * });
   * 
   * if (response.error) {
   *   console.error(response.error);
   * } else {
   *   console.log('Usuario registrado:', response.user);
   * }
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    this.loadingSubject.next(true);

    try {
      const { data, error } = await this.supabaseService.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            // Guarda solo el nombre en first_name
          first_name: credentials.fullName,
          last_name: null,
          full_name: credentials.fullName
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Sign up error:', error.message);
        const translatedError = translateAuthError(error.message);
        return { user: null, session: null, error: translatedError }
      }

      const user = data.user ? mapSupabaseUser(data.user) : null;
      
      // Actualiza el estado reactivo
      this.currentUserSubject.next(user);

      return {
        user,
        session: data.session ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0
        } : null,
        provider: 'email',
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      return {
        user: null,
        session: null,
        error: 'Error inesperado al registrarse'
      }
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // ==========================================
  // AUTENTICACIÓN OAUTH
  // ==========================================

  /**
   * Inicia autenticación OAuth con un proveedor externo
   * 
   * Redirige al usuario a la página de login del proveedor (Google, GitHub, Apple).
   * Después de autenticarse, el proveedor redirige de vuelta a la app
   * al callback configurado en getRedirectURL().
   * 
   * IMPORTANTE: Esta función redirige el navegador, no retorna un usuario.
   * El usuario se cargará cuando la app procese el callback OAuth.
   * 
   * @param provider - Proveedor OAuth (google, github, apple)
   * @param options - Opciones adicionales (redirectTo, scopes personalizados)
   * @returns Promesa con posible error (solo si falla antes de redirigir)
   * 
   * @example
   * // El navegador redirigirá automáticamente
   * await this.authService.signInWithOAuth('google');
   */
  async signInWithOAuth(
    provider: Exclude<AuthProvider, 'email'>,
    options?: OAuthOptions
  ): Promise<{ error?: string}> {
    this.loadingSubject.next(true);

    try {      
      const defaultOptions = OAuthConfig[provider];
      const redirectTo = options?.redirectTo || getRedirectURL();

      const { error } = await this.supabaseService.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: options?.scopes || defaultOptions.scopes,
        }
      });

      if (error) {
        console.error(`OAuth ${provider} error:`, error.message);
        this.loadingSubject.next(false);
        return { error: error.message };
      }

      // El navegador redirigirá automáticamente al proveedor OAuth
      // No llamamos a loadingSubject.next(false) porque la página se redirige
      return {};

    } catch (error) {
      console.error('Unexpected OAuth error:', error);
      this.loadingSubject.next(false);
      return { error: 'Error inesperado en autenticación OAuth' };
    }
  }

  /**
   * Atajo para login con Google
   * 
   * @example
   * await this.authService.signInWithGoogle();
   */
  async signInWithGoogle(options?: OAuthOptions): Promise<{ error?: string}> {
    return this.signInWithOAuth('google', options)
  }

  /**
   * Atajo para login con GitHub
   * 
   * @example
   * await this.authService.signInWithGitHub();
   */
  async signInWithGitHub(options?: OAuthOptions): Promise<{ error?: string }> {
    return this.signInWithOAuth('github', options);
  }

  /**
   * Atajo para login con Apple
   * 
   * @example
   * await this.authService.signInWithApple();
   */
  async signInWithApple(options?: OAuthOptions): Promise<{ error?: string }> {
    return this.signInWithOAuth('apple', options);
  }

  // ==========================================
  // GESTIÓN DE CONTRASEÑAS
  // ==========================================

  /**
   * Solicita un email de recuperación de contraseña
   * 
   * Envía un email al usuario con un enlace mágico para resetear su contraseña.
   * El enlace redirige a /auth/reset-password donde el usuario puede establecer
   * una nueva contraseña.
   * 
   * @param email - Email del usuario que olvidó su contraseña
   * @returns Promesa con posible error
   * 
   * @example
   * const response = await this.authService.resetPassword('user@example.com');
   * if (response.error) {
   *   console.error(response.error);
   * } else {
   *   console.log('Email enviado correctamente');
   * }
   */
  async resetPassword(email: string): Promise<{ error?: string}> {
    this.loadingSubject.next(true);

    try {
      const { error } = await this.supabaseService.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error.message);
        this.loadingSubject.next(false);
        return { error: error.message };
      }
  
      this.loadingSubject.next(false);
      return {};

    } catch (error) {
      console.error('Unexpected password reset error:', error);
      this.loadingSubject.next(false);
      return { error: 'Error inesperado al solicitar recuperación de contraseña' };
    }
  }

  /**
   * Actualiza la contraseña del usuario autenticado
   * 
   * IMPORTANTE: El usuario debe estar autenticado para cambiar su contraseña.
   * Típicamente se usaría en la vista 'Configuración' dentro del dashboard.
   * 
   * @param newPassword - Nueva contraseña
   * @returns Promesa con posible error
   * 
   * @example
   * const response = await this.authService.updatePassword('newPassword123');
   * if (response.error) {
   *   console.error(response.error);
   * } else {
   *   console.log('Contraseña actualizada');
   * }
   */
  async updatePassword(newPassword: string): Promise<{ error?: string}> {
    this.loadingSubject.next(true);

  try {    
    const { error } = await this.supabaseService.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error.message);
      this.loadingSubject.next(false);
      return { error: error.message };
    }

    this.loadingSubject.next(false);
    return {};

  } catch (error) {
    console.error('Unexpected password update error:', error);
    this.loadingSubject.next(false);
    return { error: 'Error inesperado al actualizar contraseña' };
  }
  }

  // ==========================================
  // CIERRE DE SESIÓN
  // ==========================================

  /**
   * Cierra la sesión del usuario actual
   * 
   * Elimina la sesión de Supabase (localStorage) y actualiza el estado reactivo.
   * Después de llamar a este método, el usuario será redirigido al login
   * por el authGuard.
   * 
   * @returns Promesa con posible error
   * 
   * @example
   * const response = await this.authService.signOut();
   * if (!response.error) {
   *   this.router.navigate(['/']);
   * }
   */
  async signOut(): Promise<{ error?: string }> {
    this.loadingSubject.next(true);

    const { error } = await this.supabaseService.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error.message);
      this.loadingSubject.next(false);
      return { error: error?.message };
    }
    
    // Limpia el usuario del estado reactivo
    this.currentUserSubject.next(null);
    this.loadingSubject.next(false);
    
    return {};
  }

  // ==========================================
  // GESTIÓN DE CUENTA
  // ==========================================

  /**
   * Elimina permanentemente la cuenta del usuario autenticado
   * 
   * ADVERTENCIA: Esta acción es IRREVERSIBLE. Elimina:
   * - La cuenta de autenticación de Supabase
   * - Todos los datos del usuario en auth.users
   * - Los datos relacionados se gestionarán según políticas CASCADE de la BD
   * 
   * IMPORTANTE: 
   * - El usuario debe estar autenticado para eliminar su cuenta
   * - Después de eliminar, cierra la sesión automáticamente
   * - Muestra un diálogo de confirmación antes de llamar este método
   * 
   * @returns Promesa con posible error
   * 
   * @example
   * // Con confirmación doble
   * const confirmed = confirm('¿Estás seguro de eliminar tu cuenta permanentemente?');
   * if (confirmed) {
   *   const doubleCheck = confirm('Esta acción NO se puede deshacer. ¿Continuar?');
   *   if (doubleCheck) {
   *     const response = await this.authService.deleteAccount();
   *     if (response.error) {
   *       this.notification.error(response.error);
   *     } else {
   *       this.notification.success('Cuenta eliminada correctamente');
   *       this.router.navigate(['/']);
   *     }
   *   }
   * }
   */
  async deleteAccount(): Promise<{ error?: string }> {
    this.loadingSubject.next(true);
  
    try {  
      // Verificar que hay usuario autenticado
      const user = this.currentUser;
      if (!user) {
        this.loadingSubject.next(false);
        return { error: 'No hay usuario autenticado' };
      }
  
      // Llamar a la función RPC que elimina la cuenta
      const { error } = await this.supabaseService.client.rpc('delete_own_account');
  
      if (error) {
        console.error('Account deletion error:', error.message);
        this.loadingSubject.next(false);
        return { error: error.message };
      }
  
      console.log('Account deleted successfully');
  
      // Cerrar sesión y limpiar estado
      await this.supabaseService.auth.signOut();
      this.currentUserSubject.next(null);
      this.loadingSubject.next(false);
  
      return {};
  
    } catch (error) {
      console.error('Unexpected account deletion error:', error);
      this.loadingSubject.next(false);
      return { error: 'Error inesperado al eliminar la cuenta' };
    }
  }

  
}

/**
 * Traduce mensajes de error comunes de Supabase
 */
function translateAuthError(error: string): string {
  const errorMap: { [key: string]: string } = {
    // Errores de login
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Por favor, verifica tu email antes de iniciar sesión',
    'Email link is invalid or has expired': 'El enlace de verificación ha expirado',
    'User already registered': 'Este email ya está registrado',
    
    // Errores de email
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'For security purposes, you can only request this once every 60 seconds': 'Por seguridad, espera 60 segundos antes de intentar de nuevo',
    
    // Errores de contraseña
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'New password should be different from the old password': 'La nueva contraseña debe ser diferente a la anterior',
    
    // Errores de OAuth
    'OAuth error': 'Error de autenticación con el proveedor externo',
    
    // Errores genéricos
    'User not found': 'Usuario no encontrado',
    'Signup requires a valid password': 'Se requiere una contraseña válida',
  };

  // Buscar coincidencia exacta
  if (errorMap[error]) {
    return errorMap[error];
  }

  // Buscar coincidencia parcial (por si el mensaje tiene más texto)
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return value;
    }
  }

  // Si no hay traducción, devolver el error original
  return error;
}
