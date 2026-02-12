import { ChangeDetectionStrategy, Component, OnInit, inject, effect, signal } from '@angular/core'

import { Event } from '../../models/event.interface'
import { Router, RouterLink } from '@angular/router'
import { FavoriteService } from '../../services/favorite.service'
import { EventCardComponent } from '../../component/event-card/event-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { GoBackComponent } from '@app/component/go-back-button/go-back-button.component'

@Component({
  selector: 'app-favourites',
  imports: [EventCardComponent, TranslateModule, GoBackComponent, RouterLink],
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavouritesComponent implements OnInit {
  // Signal-basiert - OHNE RxJS
  protected readonly favouriteEvents = signal<Event[]>([])
  protected readonly loading = signal(true)

  private readonly favoriteService = inject(FavoriteService)
  private readonly router = inject(Router)

  constructor() {
    // Effect um auf Änderungen zu reagieren
    effect(() => {
      this.favouriteEvents.set(this.favoriteService.favoriteEvents())
    })

    effect(() => {
      this.loading.set(this.favoriteService.loading())
    })
  }

  ngOnInit(): void {
    // Lade die Favoriten mit requestAnimationFrame
    requestAnimationFrame(() => {
      void this.favoriteService.loadFavoriteEvents()
    })
  }
}
