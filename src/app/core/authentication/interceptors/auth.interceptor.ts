import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services';
import { from, switchMap } from 'rxjs';

/**
 * Interceptor HTTP que añade automáticamente el token de autenticación
 * a todas las peticiones HTTP salientes.
 * 
 * Funcionamiento:
 * 1. Obtiene el access token actual de Supabase (refresca automáticamente si expiró)
 * 2. Si existe token, lo añade en el header Authorization: Bearer <token>
 * 3. Continúa con la petición HTTP
 * 
 * Nota: Supabase gestiona el refresh de tokens automáticamente,
 * no es necesario implementar lógica de renovación manual.
 * 
 * @example
 * // Después de registrar este interceptor en app.config.ts,
 * // todos los requests HTTP tendrán el token automáticamente:
 * this.http.get('/api/trips').subscribe(...) // ← Token añadido automáticamente
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
  
    // Convierte la Promise del token a Observable para que sea compatible con HttpInterceptor
    return from(authService.getAccessToken()).pipe(
      switchMap(token => {
        // Si hay token, clona el request y añade el header Authorization
        if (token) {
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
        }
  
        // Continúa con la petición (con o sin token)
        return next(req);
      })
    );
  };