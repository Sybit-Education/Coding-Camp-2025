import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { Router, NavigationEnd, RouterOutlet } from '@angular/router'

import { HeaderComponent } from './component/header/header.component'
import { FooterComponent } from './component/footer/footer.component'
import { filter } from 'rxjs/operators'
import { BottomNavComponent } from './component/bottom-nav/bottom-nav.component'
import { UpdateService } from './pwa/update.service'

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    BottomNavComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  title = '1200-jahre-radolfzell'
  isCarouselPage = false
  updateAvailable = false

  constructor(
    private readonly router: Router,
    private readonly updateService: UpdateService
  ) {
    this.updateService.updateAvailable$.subscribe(available => {
      this.updateAvailable = available;
    });
  }

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isCarouselPage = event.url === '/'
      })
    
    // Prüfe auf Updates beim Start
    this.updateService.checkForUpdate();
  }

  updateApp(): void {
    this.updateService.activateUpdate();
  }
}
