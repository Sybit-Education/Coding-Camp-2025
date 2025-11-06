import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'

import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { MatIconModule } from '@angular/material/icon'

interface MoreMenuItem {
  title: string
  route: string
  description: string
  icon: string
}

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterModule, TranslateModule, CommonModule, MatIconModule],
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
export class MoreComponent {
  private readonly router: Router = inject(Router)

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
      title: 'MORE.TEAM.TITLE',
      route: '/team',
      description: 'MORE.TEAM.DESCRIPTION',
      icon: 'users',
    },
    {
      title: 'MORE.IMPRINT.TITLE',
      route: 'https://www.radolfzell.de/impressum',
      description: 'MORE.IMPRINT.DESCRIPTION',
      icon: 'info-circle',
    },
    {
      title: 'MORE.PRIVACY.TITLE',
      route: 'https://www.radolfzell.de/datenschutz',
      description: 'MORE.PRIVACY.DESCRIPTION',
      icon: 'shield-check',
    },
    {
      title: 'MORE.LOGIN.TITLE',
      route: '/login',
      description: 'MORE.LOGIN.DESCRIPTION',
      icon: 'key',
    },
  ]
}
