import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BottomNavItem {
  label: string;
  icon: string; // Heroicons SVG als String oder Name aus einem Icon-Set
  safeIcon?: SafeHtml; // Sanitized icon
  route?: string; // Optionaler Router-Link
}

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class BottomNavComponent implements OnInit, OnChanges {
  constructor(private sanitizer: DomSanitizer, private router: Router) {
    // Sanitize all icons on initialization
    this.sanitizeIcons();
  }

  ngOnInit(): void {
    // Listen to router events to update active index based on current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveIndexFromRoute();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-sanitize icons if items change
    if (changes['items']) {
      this.sanitizeIcons();
    }
  }

  private sanitizeIcons(): void {
    this.items.forEach(item => {
      item.safeIcon = this.sanitizer.bypassSecurityTrustHtml(item.icon);
    });
  }

  private updateActiveIndexFromRoute(): void {
    const currentUrl = this.router.url;
    const index = this.items.findIndex(item => item.route === currentUrl);
    if (index !== -1) {
      this.activeIndex = index;
    }
  }
  @Input() items: BottomNavItem[] = [
    {
      label: 'Home',
      icon: `<svg xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439
                     1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504
                     1.125 1.125 1.125H9.75V15a2.25 2.25 0 114.5
                     0v6h4.125c.621 0 1.125-.504
                     1.125-1.125V9.75" />
             </svg>`,
      route: '/'
    },
    {
      label: 'Suchen',
      icon: `<svg xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5
                     4.5a7.5 7.5 0 0012.15 12.15z" />
             </svg>`,
      route: '/search'
    },
    {
      label: 'Mehr',
      icon: `<svg xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M6.75 12a.75.75 0 110-1.5.75.75
                     0 010 1.5zm5.25 0a.75.75 0 110-1.5.75.75
                     0 010 1.5zm5.25 0a.75.75 0 110-1.5.75.75
                     0 010 1.5z" />
             </svg>`,
      route: '/more'
    }
  ];

  @Input() activeIndex = 0;

  setActive(index: number, route?: string) {
    this.activeIndex = index;
    if (route) {
      this.router.navigate([route], { 
        state: { navigationSource: 'bottomNav' }
      });
    }
    // Announce navigation for screen readers
    this.announceNavigation(this.items[index].label);
  }

  /**
   * Announces navigation changes to screen readers
   */
  private announceNavigation(destination: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = `Navigiere zu ${destination}`;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement is read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}
