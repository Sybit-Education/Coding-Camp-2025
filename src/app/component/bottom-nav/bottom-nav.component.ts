import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Interface zur Definition der Navigationspunkte.
 * Jeder Eintrag hat ein Label, eine Ziel‑Route und ein SVG‑Icon als String.
 */
export interface BottomNavItem {
  /**
   * Beschriftung des Menüeintrags
   */
  label: string;
  /**
   * Zielroute für den Angular Router
   */
  route: string;
  /**
   * SVG‑Markup als String (wird später über DomSanitizer als SafeHtml eingebettet)
   */
  icon: string;
}

@Component({
  selector: 'app-bottom-nav',
  // Die Komponente ist standalone und importiert alle benötigten Module selbst.
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
})
export class BottomNavComponent {
  /**
   * Liste der Navigationspunkte. Kann von außen überschrieben werden.
   */
  @Input() items: BottomNavItem[] = [
    {
      label: 'Home',
      route: '/',
      icon: `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round"
    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75V15a2.25 2.25 0 114.5 0v6h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
</svg>`
    },
    {
      label: 'Suchen',
      route: '/search',
      icon: `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round"
    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
</svg>`
    },
    {
      label: 'Mehr',
      route: '/more',
      icon: `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round"
    d="M6.75 12a.75.75 0 110-1.5.75.75 0 010 1.5zm5.25 0a.75.75 0 110-1.5.75.75 0 010 1.5zm5.25 0a.75.75 0 110-1.5.75.75 0 010 1.5z" />
</svg>`
    },
  ];

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Liefert eine Liste der Navigationspunkte mit einem feld `safeIcon`,
   * das bereits über den DomSanitizer von Angular als vertrauenswürdig
   * markiert wurde. So wird verhindert, dass die SVGs beim Rendern
   * entfernt werden und es sind keine weiteren Funktionsaufrufe im
   * Template notwendig.
   */
  get itemsSafe(): (BottomNavItem & { safeIcon: SafeHtml })[] {
    return this.items.map(item => ({
      ...item,
      safeIcon: this.sanitizer.bypassSecurityTrustHtml(item.icon),
    }));
  }
}
