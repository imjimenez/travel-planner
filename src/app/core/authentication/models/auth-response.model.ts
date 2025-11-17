import { User } from "./user.model";

/**
 * Respuesta estándar de las operaciones de autenticación
 * 
 * Todas las funciones de auth (signIn, signUp, OAuth) retornan este formato
 * para mantener consistencia en el manejo de respuestas.
 */
export interface AuthResponse {
    /** Usuario autenticado (null si hubo error) */
    user: User | null;
    
    /** Información de la sesión (tokens) */
    session: Session | null;
    
    /** Mensaje de error si la operación falló */
    error?: string;
    
    /** Proveedor usado para autenticación (email, google, github, apple) */
    provider?: string;
}

/**
 * Información de sesión del usuario
 * 
 * Contiene los tokens de acceso y refresh, además del tiempo de expiración.
 */
export interface Session {
    /** Token JWT para hacer requests autenticados */
    accessToken: string;
    
    /** Token para renovar el accessToken cuando expire */
    refreshToken: string;
    
    /** Timestamp UNIX de cuando expira el accessToken */
    expiresAt: number;
}

/**
 * Credenciales para login con email/password
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Credenciales para registro de nuevo usuario
 * 
 * Extiende LoginCredentials añadiendo campos opcionales
 * como el nombre completo del usuario.
 */
export interface SignUpCredentials extends LoginCredentials {
    /** Nombre completo del usuario (se guarda en user_metadata) */
    fullName?: string;
}