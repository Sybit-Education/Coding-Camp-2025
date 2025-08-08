import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Subscription } from 'rxjs'
import { FavoriteService } from '../../services/favorite.service'

@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      *ngIf="eventId"
      (click)="toggleFavorite($event)"
      class="ml-2 focus:outline-none"
      [title]="isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'"
    >
      <!-- Solid star when favorited -->
      <svg *ngIf="isFavorite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700"
        class="w-6 h-6">
        <path fill-rule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clip-rule="evenodd" />
      </svg>

      <!-- Outline star when not favorited -->
      <svg *ngIf="!isFavorite" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </button>
  `,
  styles: []
})
export class FavoriteButtonComponent implements OnInit, OnDestroy {
  @Input() eventId = '' as string | undefined;

  isFavorite = false;
  private subscription?: Subscription;

  constructor(private readonly favoriteService: FavoriteService) {}

  ngOnInit(): void {
    if (this.eventId) {
      console.log('FavoriteButton initialized with eventId:', this.eventId);
      
      // Bereinige die Event-ID (entferne "event:" Präfix)
      const cleanId = this.eventId.toString().replace(/^event:/, '');
      
      this.isFavorite = this.favoriteService.isEventFavorite(cleanId);
      console.log('Is favorite?', this.isFavorite);

      // Subscribe to changes in saved events
      this.subscription = this.favoriteService.favoriteEvents$.subscribe(() => {
        this.isFavorite = this.favoriteService.isEventFavorite(cleanId);
      });
    } else {
      console.warn('FavoriteButton initialized without eventId');
    }
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation(); // Verhindert, dass das Event-Klick-Event ausgelöst wird
    
    if (!this.eventId) return;
    
    // Bereinige die Event-ID (entferne "event:" Präfix)
    const cleanId = this.eventId.toString().replace(/^event:/, '');
    console.log('Toggle favorite for eventId:', cleanId);

    this.favoriteService.toggleFavorite(cleanId);
    
    // Aktualisiere den Status sofort
    this.isFavorite = !this.isFavorite;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
