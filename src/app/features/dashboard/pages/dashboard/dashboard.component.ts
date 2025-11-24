import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../../../../shared/components/map/map.component';
import { MapConfig, MapCoordinates } from '../../../../shared/components/map/models';
import { LeafletService } from '../../../../shared/components/map/services/leaflet.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class OverviewComponent {
  mapConfig: Partial<MapConfig> = {
    mode: 'select-location',
    center: { lat: 42.847, lng: -2.673 },
    zoom: 13,
    height: '500px'
  };

  selectedLocation?: MapCoordinates;
  locationName?: string; // ← Añadir esto

  constructor(private leafletService: LeafletService) {} // ← Añadir esto

  onLocationSelected(coordinates: MapCoordinates): void {
    this.selectedLocation = coordinates;
    console.log('Ubicación seleccionada:', coordinates);
    
    // Buscar el nombre del lugar
    this.getLocationName(coordinates);
  }

  // ← Añadir este método
  private getLocationName(coordinates: MapCoordinates): void {
    // Usar directamente la API de Nominatim
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&accept-language=es`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          this.locationName = data.display_name;
          console.log('Nombre del lugar:', this.locationName);
        } else {
          this.locationName = 'Ubicación desconocida';
        }
      })
      .catch(error => {
        console.error('Error obteniendo nombre:', error);
        this.locationName = 'Error al obtener nombre';
      });
  }
}