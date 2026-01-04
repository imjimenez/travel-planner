import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  step: string;
  title: string;
  description: string;
}

@Component({
  imports: [ButtonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent {
  mobileMenuOpen = signal(false);
  features = signal<Feature[]>([
    {
      icon: 'pi-map-marker',
      title: 'Destinos e Itinerarios',
      description:
        'Selecciona tu destino, define fechas y planifica cada parada de tu viaje con detalle.',
    },
    {
      icon: 'pi-users',
      title: 'Colaboración en Grupo',
      description:
        'Invita participantes y planificad juntos. Todos ven los cambios en tiempo real.',
    },
    {
      icon: 'pi-file',
      title: 'Documentos Organizados',
      description:
        'Guarda billetes, reservas, pasaportes y documentos importantes en un solo lugar.',
    },
    {
      icon: 'pi-check-square',
      title: 'Listas To-Do',
      description: 'Crea tareas, asígnalas al equipo y asegúrate de que no se olvida nada.',
    },
  ]);

  steps = signal<Step[]>([
    {
      step: '01',
      title: 'Crea tu viaje',
      description: 'Define destino, fechas y detalles básicos en segundos.',
    },
    {
      step: '02',
      title: 'Invita al equipo',
      description: 'Añade participantes para planificar juntos en tiempo real.',
    },
    {
      step: '03',
      title: 'Organiza todo',
      description: 'Itinerarios, documentos, tareas. Todo en un solo lugar.',
    },
  ]);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }
}
