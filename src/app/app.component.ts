import { Component, OnInit } from '@angular/core'
import { Router, NavigationEnd, RouterOutlet } from '@angular/router'
import { CommonModule } from '@angular/common'
import { HeaderComponent } from './component/header/header.component'
import { FooterComponent } from './component/footer/footer.component'
import { filter } from 'rxjs/operators'

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = '1200-jahre-radolfzell'
  isCarouselPage = false

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isCarouselPage = event.url === '/'
      })
  }
}
