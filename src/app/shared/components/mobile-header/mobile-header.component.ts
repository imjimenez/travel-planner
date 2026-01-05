import { CommonModule } from '@angular/common';
import { Component, inject, input, signal, type OnInit, type OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { getFullName, getUserInitials, type User } from '@core/authentication';
import { type Trip, TripInviteService } from '@core/trips';

/**
 * Componente de header mobile/tablet
 *
 * Muestra la navegación horizontal y la información del usuario en dispositivos móviles
 */
@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './mobile-header.component.html',
  styles: `

    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
	`,
})
export class MobileHeaderComponent implements OnInit, OnDestroy {
  trips = input.required<Trip[]>();
  user = input.required<User | null>();

  private inviteService = inject(TripInviteService);
  public router = inject(Router);

  pendingInvitesCount = signal(0);

  async ngOnInit() {
    await this.loadPendingInvites();
    window.addEventListener('inviteAccepted', this.handleInviteAccepted.bind(this));
  }

  private async loadPendingInvites() {
    try {
      const invites = await this.inviteService.getMyInvites();
      this.pendingInvitesCount.set(invites.length);
    } catch (error) {
      console.error('Error loading pending invites:', error);
      this.pendingInvitesCount.set(0);
    }
  }

  private handleInviteAccepted(event: Event) {
    const customEvent = event as CustomEvent;
    this.pendingInvitesCount.set(customEvent.detail);
  }

  ngOnDestroy() {
    window.removeEventListener('inviteAccepted', this.handleInviteAccepted.bind(this));
  }

  getInitial(user: User | null): string {
    if (!user || !user.email) return 'U';
    return getUserInitials(user);
  }

  getDisplayName(user: User | null): string {
    if (!user) return 'Usuario';
    return getFullName(user);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  isTripActive(tripId: string): boolean {
    return this.router.url.includes(`/trips/${tripId}`);
  }
}
