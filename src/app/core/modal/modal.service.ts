// core/modal/modal.service.ts
import { Injectable, signal } from '@angular/core';

type ModalType = 'participants' | 'documents' | 'checklist' | null;

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private activeModalSignal = signal<ModalType>(null);
  activeModal = this.activeModalSignal.asReadonly();

  private tripIdSignal = signal<string | null>(null);
  tripId = this.tripIdSignal.asReadonly();

  openParticipantsModal(tripId: string) {
    this.tripIdSignal.set(tripId);
    this.activeModalSignal.set('participants');
  }

  openDocumentsModal(tripId: string) {
    this.tripIdSignal.set(tripId);
    this.activeModalSignal.set('documents');
  }

  openChecklistModal(tripId: string) {
    this.tripIdSignal.set(tripId);
    this.activeModalSignal.set('checklist');
  }

  close() {
    this.activeModalSignal.set(null);
    this.tripIdSignal.set(null);
  }

  isOpen(): boolean {
    return this.activeModal() !== null;
  }
}
