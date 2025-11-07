import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'

import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { IconComponent } from '../../icons/icon.component'
import { LoginService } from '@app/services/login.service'

interface MoreMenuItem {
  title: string
  route: string
  description: string
  icon: string
}

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterModule, TranslateModule, CommonModule, IconComponent],
  templateUrl: './more.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoreComponent implements OnInit {
  private readonly router: Router = inject(Router)
  private readonly loginService = inject(LoginService)
  loggedIn = false

  ngOnInit(): void {
    this.loginService.isLoggedIn().then((isLoggedIn) => {
      this.loggedIn = isLoggedIn
    })
  }

  /**
   * Navigiert zu einer bestimmten Route
   * @param route Die Zielroute
   */
  navigateTo(route: string): void {
    this.router.navigate([route])
    // Ankündigung für Screenreader
    this.announceNavigation(route)
  }

  /**
   * Kündigt die Navigation für Screenreader an
   * @param route Die Zielroute
   */
  private announceNavigation(route: string): void {
    const menuItem = this.menuItems.find((item) => item.route === route)
    if (menuItem) {
      // In einer vollständigen Implementierung würde hier LiveAnnouncer verwendet werden
      console.log(`Navigiere zu: ${menuItem.title}`)
    }
  }
  menuItems: MoreMenuItem[] = [
    {
      title: 'Das Team',
      route: '/team',
      description: 'MORE.TEAM.DESCRIPTION',
      icon: 'users',
    },
    {
      title: 'Impressum',
      route: 'https://www.radolfzell.de/impressum',
      description: 'MORE.IMPRINT.DESCRIPTION',
      icon: 'info-circle',
    },
    {
      title: 'Datenschutz',
      route: 'https://www.radolfzell.de/datenschutz',
      description: 'MORE.PRIVACY.DESCRIPTION',
      icon: 'shield-check',
    },
    {
      title: 'Admin',
      route: '/login',
      description: 'MORE.LOGIN.DESCRIPTION',
      icon: 'key',
    },
  ]
}
