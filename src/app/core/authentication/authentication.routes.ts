// Rutas del módulo
import { Routes } from '@angular/router';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';

/**
 * Rutas del módulo de autenticación
 * 
 * Todas estas rutas son públicas (no requieren autenticación).
 * Se montan bajo el path /auth/ en las rutas principales de la app.
 * 
 * Rutas disponibles:
 * - /auth/login → Inicio de sesión
 * - /auth/register → Registro de nuevos usuarios
 * - /auth/forgot-password → Recuperación de contraseña
 * - /auth/callback → Procesamiento de callbacks OAuth (Google, GitHub, Apple)
 * - /auth → Redirige automáticamente a /auth/login
 */
export const authenticationRoutes: Routes = [
    {
        path: 'callback',
        component: AuthCallbackComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent
    },
    {
        // Ruta por defecto: redirige a login
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
]