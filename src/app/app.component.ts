import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { Router, NavigationEnd, RouterOutlet } from '@angular/router'
import { LiveAnnouncer } from '@angular/cdk/a11y'
import { TranslateService } from '@ngx-translate/core'

import { HeaderComponent } from './component/header/header.component'
import { FooterComponent } from './component/footer/footer.component'
import { filter } from 'rxjs/operators'
import { BottomNavComponent } from './component/bottom-nav/bottom-nav.component'
import { UpdateService } from './pwa/update.service'
import { SnackBarComponent } from './component/snack-bar/snack-bar.component'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BottomNavComponent, SnackBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  title = '1200-jahre-radolfzell'
  isCarouselPage = false
  updateAvailable = false

  private readonly updateService = inject(UpdateService)
  private readonly router = inject(Router)
  private readonly liveAnnouncer = inject(LiveAnnouncer)
  private readonly translate = inject(TranslateService)

  constructor() {
    this.updateService.updateAvailable$.subscribe((available) => {
      this.updateAvailable = available
    })
  }

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isCarouselPage = event.urlAfterRedirects === '/'

        // Fokus auf den Hauptinhalt setzen
        setTimeout(() => {
          const main = document.getElementById('main-content')
          if (main) {
            main.focus()
          }
        }, 0)

        // Screenreader informieren
        this.liveAnnouncer.clear()
        this.liveAnnouncer.announce(this.translate.instant('COMMON.PAGE_UPDATED'), 'polite')
      })

    // Prüfe auf Updates beim Start
    this.updateService.checkForUpdate()
  }

  updateApp(): void {
    this.updateService.activateUpdate()
  }
}
