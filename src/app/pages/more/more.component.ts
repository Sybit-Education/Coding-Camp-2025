import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
// Für eine vollständige Implementierung würde LiveAnnouncer importiert werden
// import { LiveAnnouncer } from '@angular/cdk/a11y';

interface MoreMenuItem {
  title: string
  route: string
  description: string
  icon: string
}

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './more.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class MoreComponent {
  constructor(private router: Router) {}

  /**
   * Navigiert zu einer bestimmten Route
   * @param route Die Zielroute
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
    // Ankündigung für Screenreader
    this.announceNavigation(route);
  }

  /**
   * Kündigt die Navigation für Screenreader an
   * @param route Die Zielroute
   */
  private announceNavigation(route: string): void {
    const menuItem = this.menuItems.find(item => item.route === route);
    if (menuItem) {
      // In einer vollständigen Implementierung würde hier LiveAnnouncer verwendet werden
      console.log(`Navigiere zu: ${menuItem.title}`);
    }
  }
  menuItems: MoreMenuItem[] = [
    {
      title: 'Das Team',
      route: '/team',
      description:
        'Lernen Sie das Team hinter der 1200-Jahre-Radolfzell App kennen.',
      icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    },
    {
      title: 'Der Sponsor',
      route: '/sponsor',
      description: 'Informationen über unsere Sponsoren und Unterstützer.',
      icon: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z',
    },
    {
      title: 'Impressum',
      route: '/impressum',
      description: 'Rechtliche Informationen und Kontaktdaten.',
      icon: 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
    },
    {
      title: 'Datenschutz',
      route: '/datenschutz',
      description: 'Informationen zum Datenschutz und zur Datenverarbeitung.',
      icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z',
    },
    {
      title: 'Login',
      route: '/login',
      description: 'Interne Datenverwaltung der Einträge.',
      icon: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z'
    },
  ]
}
