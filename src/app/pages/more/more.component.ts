import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

import { IconComponent } from '@app/component/icon/icon.component'

interface MoreMenuItem {
  title: string
  route: string
  description: string
  icon: string
}

@Component({
  selector: 'app-more',
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
export class MoreComponent {
  protected readonly menuItems: MoreMenuItem[] = [
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

  protected isExternal(item: MoreMenuItem): boolean {
    return item.route.startsWith('http')
  }
}
