import { Component, input, signal, computed, effect, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FavoriteService } from '../../services/favorite.service'
import { TranslateModule } from '@ngx-translate/core'
import { IconComponent } from '../icon/icon.component'

import { RecordId } from 'surrealdb'

@Component({
  selector: 'app-favorite-button',
  imports: [TranslateModule, IconComponent],
  templateUrl: './favorite-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteButtonComponent {
  // Signal-based Inputs
  readonly eventId = input<RecordId<'event'>>()
  readonly isSmall = input<boolean>(false)

  // Services
  private readonly favoriteService = inject(FavoriteService)
  private readonly destroyRef = inject(DestroyRef)

  // Local state as signal
  protected readonly isFavorite = signal(false)

  constructor() {
    // Effect to update favorite status when eventId changes
    effect(() => {
      const id = this.eventId()
      if (id) {
        this.updateFavoriteStatus(id)
      }
    })

    // Subscribe to favorite changes
    this.favoriteService.favoriteEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const id = this.eventId()
        if (id) {
          this.updateFavoriteStatus(id)
        }
      })

    // Subscribe to localStorage changes
    this.favoriteService.localStorageService.savedEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const id = this.eventId()
        if (id) {
          this.updateFavoriteStatus(id)
        }
      })
  }

  private updateFavoriteStatus(eventId: RecordId<'event'>): void {
    const currentStatus = this.favoriteService.isEventFavorite(eventId.toString())
    this.isFavorite.set(currentStatus)
  }

  protected toggleFavorite(event: Event): void {
    event.stopPropagation() // Verhindert, dass das Event-Klick-Event ausgelöst wird

    const id = this.eventId()
    if (!id) return
    this.favoriteService.toggleFavorite(id.toString())
  }
}
