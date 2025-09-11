import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core'
import { Subscription } from 'rxjs'
import { FavoriteService } from '../../services/favorite.service'
import { TranslateModule } from '@ngx-translate/core'

import { RecordId } from 'surrealdb'

@Component({
  selector: 'app-favorite-button',
  imports: [TranslateModule],
  templateUrl: './favorite-button.component.html',
})
export class FavoriteButtonComponent implements OnInit, OnDestroy {
  @Input() eventId: RecordId<'event'> | undefined

  isFavorite = false
  private subscription?: Subscription

  private readonly favoriteService = inject(FavoriteService)

  ngOnInit(): void {
    if (this.eventId) {
      // Initialer Status
      this.updateFavoriteStatus()

      // Subscribe to changes in saved events
      this.subscription = this.favoriteService.favoriteEvents$.subscribe(() => {
        this.updateFavoriteStatus()
      })

      // Subscribe to localStorage changes directly
      this.subscription.add(
        this.favoriteService.localStorageService.savedEvents$.subscribe(() => {
          this.updateFavoriteStatus()
        }),
      )
    } else {
      console.warn('FavoriteButton initialized without eventId')
    }
  }

  private updateFavoriteStatus(): void {
    if (this.eventId) {
      const currentStatus = this.favoriteService.isEventFavorite(
        this.eventId.toString(),
      )
      this.isFavorite = currentStatus
    }
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation() // Verhindert, dass das Event-Klick-Event ausgelöst wird

    if (!this.eventId) return
    this.favoriteService.toggleFavorite(this.eventId.toString())

    // Der Status wird durch die Subscription aktualisiert
    // Wir setzen ihn nicht direkt, um Inkonsistenzen zu vermeiden
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }
}
