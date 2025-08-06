import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
   * Schlüssel des Icons. Dieser Name muss mit dem Namen übereinstimmen,
   * unter dem das Icon in ``provideIcons`` registriert wurde (z.B. 'home').
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
}
