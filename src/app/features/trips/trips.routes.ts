import type { Routes } from '@angular/router';
import { TripDetailComponent } from './pages/trip-detail/trip-detail.component';

/**
 * Rutas del módulo Trips
 */
const tripsRoutes: Routes = [
  {
    path: ':id',
    component: TripDetailComponent,
  },
];

export default tripsRoutes;
