// Configuración de OAuth (redirect URLs, scopes, etc)

import type { OAuthOptions } from "./auth-provider.type";

/**
 * Configuración por defecto para cada proveedor OAuth
 *
 * Define los scopes (permisos) que se solicitarán a cada proveedor.
 * El redirectTo se configura dinámicamente usando environment variables.
 */
export const OAuthConfig: Record<string, OAuthOptions> = {
	google: {
		scopes: "email profile", // Acceso a email y perfil básico
	},
	github: {
		scopes: "user:email", // Acceso al email del usuario
	},
	apple: {
		scopes: "email name", // Acceso a email y nombre
	},
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
	return `${window.location.origin}/oauth/callback`;
}
