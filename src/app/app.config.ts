import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/authentication/interceptors/auth.interceptor';
import { routes } from './app.routes';

/**
 * Configuración principal de la aplicación
 * 
 * Define todos los providers globales necesarios para el funcionamiento de la app:
 * - Change detection sin Zone.js (mejor performance)
 * - Router con las rutas de la aplicación
 * - HttpClient con interceptor de autenticación
 * - Listeners globales de errores del navegador
 * 
 * Esta configuración se aplica al arrancar la app en main.ts
 */
export const appConfig: ApplicationConfig = {
  providers: [

    // Listeners de errores del navegador (útil para debugging)
    provideBrowserGlobalErrorListeners(),

    // Change detection sin Zone.js (requiere signals y OnPush)
    // Mejor performance que el change detection tradicional de Angular
    provideZonelessChangeDetection(),

    // Sistema de routing de Angular
    provideRouter(routes),

    // HttpClient con interceptor que añade token de auth automáticamente
    // Esto hace que todas las peticiones HTTP incluyan el header Authorization
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
