import { Component, OnInit } from '@angular/core'
import { Router, NavigationEnd, RouterOutlet } from '@angular/router'

import { HeaderComponent } from './component/header/header.component'
import { FooterComponent } from './component/footer/footer.component'
import { filter } from 'rxjs/operators'
import { BottomNavComponent } from './component/bottom-nav/bottom-nav.component'

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
})
export class AppComponent implements OnInit {
  title = '1200-jahre-radolfzell'
  isCarouselPage = false

  constructor(private readonly router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isCarouselPage = event.url === '/'
      })
  }
}
