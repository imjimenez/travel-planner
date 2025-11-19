import { Routes } from '@angular/router';
import { SettingsComponent } from './pages/settings/settings.component';

/**
 * Rutas del módulo Settings
 * 
 * Ruta: /settings
 * Configuración y preferencias del usuario.
 */
export default [
    {
        path: '',
        component: SettingsComponent
    }
] as Routes;