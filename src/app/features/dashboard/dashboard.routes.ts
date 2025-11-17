import { Routes } from '@angular/router';
import { OverviewComponent } from './pages/dashboard/dashboard.component';

/**
 * Rutas del módulo Overview
 * 
 * Ruta: /overview
 * Muestra la vista general con resumen de todos los viajes del usuario.
 */
export default [
    {
        path: '',
        component: OverviewComponent
    }
] as Routes;