import { Component, OnDestroy, OnInit, inject } from '@angular/core'

import { Event } from '../../models/event.interface'
import { Router } from '@angular/router'
import { FavoriteService } from '../../services/favorite.service'
import { Subscription } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import { EventCardComponent } from '../../component/event-card/event-card.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [EventCardComponent, TranslateModule],
  templateUrl: './favourites.component.html',
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class FavouritesComponent implements OnInit, OnDestroy {
  favouriteEvents: Event[] = []
  loading = true

  private readonly favoriteService = inject(FavoriteService)
  private readonly router = inject(Router)
  private subscriptions = new Subscription()

  ngOnInit(): void {
    // Abonniere Änderungen an den Favoriten mit distinctUntilChanged für weniger Updates
    this.subscriptions.add(
      this.favoriteService.favoriteEvents$.pipe(
        distinctUntilChanged((prev, curr) => 
          prev.length === curr.length && 
          prev.every((event, i) => event.id?.id === curr[i].id?.id)
        )
      ).subscribe(
        (events) => {
          this.favouriteEvents = events
        },
      )
    )

    // Abonniere den Ladezustand mit distinctUntilChanged
    this.subscriptions.add(
      this.favoriteService.loading$.pipe(
        distinctUntilChanged()
      ).subscribe((loading) => {
        this.loading = loading
      }),
    )

    // Lade die Favoriten mit requestAnimationFrame statt setTimeout für bessere Performance
    requestAnimationFrame(() => {
      this.favoriteService.loadFavoriteEvents()

      // Sicherheits-Timeout: Setze loading auf false nach 2 Sekunden, falls es hängen bleibt
      const timeoutId = setTimeout(() => {
        if (this.loading) {
          this.loading = false
        }
      }, 2000)
      
      // Timeout beim Zerstören der Komponente aufräumen
      this.subscriptions.add({
        unsubscribe: () => clearTimeout(timeoutId)
      })
    })
  }

  navigateToEvent(event: Event): void {
    if (event.id) {
      const eventId = event.id.toString()
      // Für die Navigation müssen wir das "event:" Präfix entfernen, da die Route es nicht erwartet
      const routeId = eventId.replace(/^event:/, '')
      this.router.navigate(['/event', routeId])
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/'])
  }

  removeFavourite(event: MouseEvent, favouriteEvent: Event): void {
    event.stopPropagation() // Verhindert Navigation zum Event

    if (favouriteEvent.id) {
      const eventId = favouriteEvent.id.toString()
      this.favoriteService.removeFromFavorites(eventId)
    }
  }

  ngOnDestroy(): void {
    // Alle Subscriptions beenden
    this.subscriptions.unsubscribe()
  }
}
