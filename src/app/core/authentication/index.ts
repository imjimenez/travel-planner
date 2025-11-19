/**
 * Barrel file para el módulo de autenticación
 * Exporta todos los servicios, guards, modelos y utilidades relacionadas con auth
 */

// Modelos de datos
export * from './models';

// Servicios
export * from './services';

// Guards de protección de rutas
export * from './guards/auth.guard';

// Configuración de proveedores OAuth
export * from './providers';

// Interceptor HTTP (no se exporta porque se registra en app.config.ts)
// import { authInterceptor } from './interceptors/auth.interceptor';