import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core'
import { Router, NavigationEnd, RouterOutlet } from '@angular/router'
import { LiveAnnouncer } from '@angular/cdk/a11y'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { HeaderComponent } from './component/header/header.component'
import { FooterComponent } from './component/footer/footer.component'
import { filter } from 'rxjs/operators'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BottomNavComponent } from './component/bottom-nav/bottom-nav.component'
import { UpdateService } from './pwa/update.service'
import { SnackBarComponent } from './component/snack-bar/snack-bar.component'

@Component({
  selector: 'app-root',
  imports: [TranslateModule, RouterOutlet, HeaderComponent, FooterComponent, BottomNavComponent, SnackBarComponent],
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

        // Fokus auf den Hauptinhalt setzen, ohne bestehende Fokusquelle zu verdrängen
        requestAnimationFrame(() => {
          const activeElement = document.activeElement
          const shouldMoveFocus = !activeElement || activeElement === document.body || activeElement === document.documentElement
          if (!shouldMoveFocus) {
            return
          }

          const main = document.getElementById('main-content')
          main?.focus()
        })

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
