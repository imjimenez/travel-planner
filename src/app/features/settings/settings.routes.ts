import type { Routes } from '@angular/router';
import SettingsComponent from './pages/settings/settings.component';

/**
 * Rutas del módulo Settings
 *
 * Ruta: /settings
 * Configuración y preferencias del usuario.
 */
const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsComponent,
  },
];
export default settingsRoutes;
