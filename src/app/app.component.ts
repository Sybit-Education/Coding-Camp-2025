import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, PLATFORM_ID } from '@angular/core'
import { Router, NavigationEnd, RouterOutlet } from '@angular/router'
import { isPlatformBrowser, DOCUMENT } from '@angular/common'
import { LiveAnnouncer } from '@angular/cdk/a11y'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { HeaderComponent } from './component/header/header.component'
import { FooterComponent } from './component/footer/footer.component'
import { filter } from 'rxjs/operators'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BottomNavComponent } from './component/bottom-nav/bottom-nav.component'
import { UpdateService } from './pwa/update.service'
import { SnackBarComponent } from './component/snack-bar/snack-bar.component'
import { PwaInstallBannerComponent } from './component/pwa-install-banner/pwa-install-banner.component'

@Component({
  selector: 'app-root',
  imports: [
    TranslateModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    BottomNavComponent,
    SnackBarComponent,
    PwaInstallBannerComponent,
  ],
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
  private readonly destroyRef = inject(DestroyRef)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly document = inject(DOCUMENT)
  private readonly isBrowser = isPlatformBrowser(this.platformId)

  constructor() {
    this.updateService.updateAvailable$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((available) => {
      this.updateAvailable = available
    })
  }

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event: NavigationEnd) => {
        this.isCarouselPage = event.urlAfterRedirects === '/'

        // Only run focus management in browser
        if (this.isBrowser) {
          // Fokus auf den Hauptinhalt setzen, ohne bestehende Fokusquelle zu verdrängen
          requestAnimationFrame(() => {
            const activeElement = this.document.activeElement
            const shouldMoveFocus = !activeElement || activeElement === this.document.body || activeElement === this.document.documentElement
            if (!shouldMoveFocus) {
              return
            }

            const main = this.document.getElementById('main-content')
            main?.focus()
          })
        }

        // Screenreader informieren
        this.liveAnnouncer.clear()
        this.liveAnnouncer.announce(this.translate.instant('COMMON.PAGE_UPDATED'), 'polite')
      })

    // Prüfe auf Updates beim Start (only in browser)
    if (this.isBrowser) {
      this.updateService.checkForUpdate()
    }
  }

  updateApp(): void {
    this.updateService.activateUpdate()
  }
}
