/**
 * Barrel file para el módulo de autenticación
 * Exporta todos los servicios, guards, modelos y utilidades relacionadas con auth
 */

// Guards de protección de rutas
export * from "./guards/auth.guard";
export * from "./guards/oauth-callback.guard";
// Modelos de datos
export * from "./models";
// Configuración de proveedores OAuth
export * from "./providers";
// Servicios
export * from "./services/auth.service";

// Interceptor HTTP (no se exporta porque se registra en app.config.ts)
// import { authInterceptor } from './interceptors/auth.interceptor';
