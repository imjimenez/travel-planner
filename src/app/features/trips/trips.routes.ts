import type { Routes } from '@angular/router';
import { TripDetailComponent } from './pages/trip-detail/trip-detail.component/trip-detail.component';

// import { TripDetailComponent } from './pages/trip-detail/trip-detail.component';
// import { TripCreateComponent } from './pages/trip-create/trip-create.component';

/**
 * Rutas del módulo Trips
 *
 * Rutas disponibles:
 * - /trips/:id → Detalle de un viaje específico
 * - /trips/new → Crear nuevo viaje
 *
 * TODO: Descomentar cuando se creen los componentes
 */
const tripsRoutes: Routes = [
  // {
  //     path: 'new',
  //     component: TripCreateComponent
  // },
  {
    path: ':id',
    component: TripDetailComponent,
  },
];

export default tripsRoutes;
