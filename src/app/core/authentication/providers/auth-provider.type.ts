/**
 * Tipos de proveedores de autenticación soportados por la aplicación
 * 
 * - email: Autenticación tradicional con email/password
 * - google: OAuth con Google
 * - github: OAuth con GitHub
 * - apple: OAuth con Apple (Sign in with Apple)
 */
export type AuthProvider = 'email' | 'google' | 'github' | 'apple';

/**
 * Opciones de configuración para autenticación OAuth
 */
export interface OAuthOptions {
    /** URL a la que redirigir después de autenticación exitosa */
    redirectTo?: string;
    
    /** Scopes (permisos) solicitados al proveedor OAuth */
    scopes?: string;
}

/**
 * Metadata del proveedor de autenticación en el usuario
 * 
 * Usado internamente para tracking de qué proveedores
 * ha usado un usuario para autenticarse.
 */
export interface ProviderMetadata {
    /** Tipo de proveedor */
    provider: AuthProvider;
    
    /** ID del usuario en el sistema del proveedor (opcional) */
    providerId?: string;
  }