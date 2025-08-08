import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Event } from '../../models/event.interface'
import { Router } from '@angular/router'
import { DateTimeRangePipe } from '../../services/date.pipe'
import { FavoriteService } from '../../services/favorite.service'
import { Subscription } from 'rxjs'
import { EventCardComponent } from '../../component/event-card/event-card.component'

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [CommonModule, DateTimeRangePipe, EventCardComponent],
  templateUrl: './favourites.component.html',
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class FavouritesComponent implements OnInit, OnDestroy {
  favouriteEvents: Event[] = [];
  loading = true;

  private readonly favoriteService = inject(FavoriteService);
  private readonly router = inject(Router);
  private subscription?: Subscription;

  ngOnInit(): void {
    console.log('FavouritesComponent initialized');
    
    // Abonniere Änderungen an den Favoriten
    this.subscription = this.favoriteService.favoriteEvents$.subscribe(events => {
      console.log('Received favorite events:', events);
      this.favouriteEvents = events;
    });
    
    // Abonniere den Ladezustand
    this.subscription.add(
      this.favoriteService.loading$.subscribe(loading => {
        console.log('Loading state changed:', loading);
        this.loading = loading;
      })
    );
    
    // Lade die Favoriten mit einem kleinen Timeout
    setTimeout(() => {
      console.log('Explicitly loading favorite events from component');
      this.favoriteService.loadFavoriteEvents();
    }, 100);
  }

  navigateToEvent(event: Event): void {
    if (event.id) {
      const eventId = event.id.toString().replace('event:', '');
      this.router.navigate(['/event', eventId]);
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  removeFavourite(event: MouseEvent, favouriteEvent: Event): void {
    event.stopPropagation(); // Verhindert Navigation zum Event

    if (favouriteEvent.id) {
      const eventId = favouriteEvent.id.toString().replace('event:', '');
      this.favoriteService.removeFromFavorites(eventId);
    }
  }
  
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
