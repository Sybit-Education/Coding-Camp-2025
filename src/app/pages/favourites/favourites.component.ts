import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core'

import { Event } from '../../models/event.interface'
import { Router, RouterLink } from '@angular/router'
import { FavoriteService } from '../../services/favorite.service'
import { Subscription } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import { EventCardComponent } from '../../component/event-card/event-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
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
  favouriteEvents: Event[] = []
  loading = true

  private readonly favoriteService = inject(FavoriteService)
  private readonly router = inject(Router)
  private readonly subscriptions = new Subscription()
  private readonly markForCheck = injectMarkForCheck()

  ngOnInit(): void {
    // Abonniere Änderungen an den Favoriten mit distinctUntilChanged für weniger Updates
    this.subscriptions.add(
      this.favoriteService.favoriteEvents$
        .pipe(
          distinctUntilChanged(
            (prev, curr) => prev.length === curr.length && prev.every((event, i) => event.id?.id === curr[i].id?.id),
          ),
        )
        .subscribe((events) => {
          this.favouriteEvents = events
        }),
    )

    // Abonniere den Ladezustand mit distinctUntilChanged
    this.subscriptions.add(
      this.favoriteService.loading$.pipe(distinctUntilChanged()).subscribe((loading) => {
        this.loading = loading
        // Change Detection auslösen, da wir OnPush verwenden
        this.markForCheck()
      }),
    )

    // Lade die Favoriten mit requestAnimationFrame statt setTimeout für bessere Performance
    requestAnimationFrame(() => {
      this.favoriteService.loadFavoriteEvents()
    })
  }
}
