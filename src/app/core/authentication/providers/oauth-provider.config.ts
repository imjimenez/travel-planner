// Configuración de OAuth (redirect URLs, scopes, etc)

import { OAuthOptions } from "./auth-provider.type";
import { environment } from "../../../../environments/environment";

/**
 * Configuración por defecto para cada proveedor OAuth
 * 
 * Define los scopes (permisos) que se solicitarán a cada proveedor.
 * El redirectTo se configura dinámicamente usando environment variables.
 */
export const OAuthConfig = {
    google: {
      scopes: 'email profile', // Acceso a email y perfil básico
    } as OAuthOptions,
  
    github: {
      scopes: 'user:email', // Acceso al email del usuario
    } as OAuthOptions,
  
    apple: {
      scopes: 'email name', // Acceso a email y nombre
    } as OAuthOptions,
};

/**
 * Obtiene la URL de redirección completa para OAuth
 * 
 * Construye la URL combinando la URL base de la app con el path del callback.
 * Esta URL debe estar registrada en la configuración de cada proveedor OAuth
 * (Google Cloud Console, GitHub OAuth Apps, Apple Developer, etc.)
 * 
 * @returns URL completa del callback OAuth (ej: https://miapp.com/auth/callback)
 */
export function getRedirectURL(): string {
    return `${environment.appURL}${environment.oauthCallbackPath}`;
}