import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/translate.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

// -----------------------------------------------------------------------------
// HeaderComponent
//
// Diese Komponente implementiert einen flexiblen Header im Stil des
// Jubiläums‑Corporate‑Designs von Radolfzell. In der Ausgangsform füllt
// der Header die volle Breite des Geräts und zeigt die vollständige
// Logovariante (Bildmarke, Wortmarke und Slogan). Beim Scrollen schrumpft
// der Header sanft, die Ausrichtung wechselt nach links und eine reduzierte
// Logovariante tritt an die Stelle des vollständigen Logos. Gleichzeitig
// wird der Hintergrund transparent, so dass der nachfolgende Inhalt direkt
// unter dem Header sichtbar bleibt. Die Auswahl der passenden Logo‑Stufe
// erfolgt abhängig vom aktuellen Zustand, der Fensterbreite und dem
// Farbschema (Hell-/Dunkelmodus). Alle Parameter können über Inputs
// überschrieben werden.

/**
 * Typ zur Definition eines Bildpfads für helles und dunkles Farbschema.
 */
interface ThemeSrc { light: string; dark: string }

/**
 * Zusammenstellung der möglichen Logostufen. Je nach verfügbarer Variante
 * kann die Darstellung im verkleinerten Zustand weiter reduziert werden.
 */
interface LogoSet {
  /** Vollversion (Bildmarke + Wortmarke + Slogan) */
  full: ThemeSrc;
  /** 1. Reduktion (ohne „JAHRE“) – optional */
  reduced1?: ThemeSrc;
  /** 2. Reduktion (ohne Slogan) – optional */
  reduced2?: ThemeSrc;
  /** 3. Stufe: nur Bildmarke „1200“ – optional */
  markOnly?: ThemeSrc;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  /**
   * Aktuell ausgewählte Sprache
   */
  currentLang: string = '';
  /**
   * Bündel aller möglichen Logovarianten. Per Default wird die transparente
   * PNG‑Datei aus dem Assets‑Ordner verwendet. Der Benutzer kann dieses
   * Objekt überschreiben, um eigene Dateipfade oder weitere Reduktionsstufen
   * anzugeben. Alle Pfade sollten relativ zum „assets“‑Ordner angegeben
   * werden.
   */
  @Input() logo: LogoSet = {
    full: {
      light: '/header/Radolfzell_1200Logo_Web_transparenter_Grund.png',
      dark: '/header/Radolfzell_1200Logo_Web_transparenter_Grund.png',
    },
    // Optional: reduzierte Varianten laut Manual können hier angegeben werden.
    reduced1: { light: '/header/Radolfzell_1200Logo_Web_transparenter_Grund_reduced1.png', dark: '/header/Radolfzell_1200Logo_Web_transparenter_Grund_reduced1.png' },
    reduced2: { light: '/header/Radolfzell_1200Logo_Web_transparenter_Grund_reduced1.png', dark: '/header/Radolfzell_1200Logo_Web_transparenter_Grund_reduced1.png' },
    markOnly: { light: '/header/Radolfzell_1200Logo_Web_transparenter_Grund_small.png', dark: '/header/Radolfzell_1200Logo_Web_transparenter_Grund_small.png' },
  };

  /**
   * Abstand in Pixeln, ab dem der Header schrumpft. Standard: 120px.
   */
  @Input() shrinkThreshold = 120;

  /**
   * Steuerung, ob die Wellenform unter dem Header angezeigt wird. Kann
   * deaktiviert werden, falls der Header ohne Bögen erscheinen soll.
   */
  @Input() showWave = true;

  /**
   * Flag, ob der Header aktuell im verkleinerten Zustand dargestellt wird.
   */
  isShrunk = false;

  /**
   * Interne Eigenschaft, die den aktuell ausgewählten Bildpfad für das
   * Logo enthält. Dieser Wert wird über die Methode pickLogoForState()
   * bestimmt und in updateState() gesetzt.
   */
  currentSrc = '';

  constructor(private i18nService: I18nService) {
    this.currentLang = this.i18nService.getCurrentLang();
  }

  ngOnInit(): void {
    this.updateState();
  }


  /**
   * Listener für Scrollereignisse: prüft bei jedem Scrollen, ob der
   * Schwellenwert überschritten wurde, und aktualisiert den Zustand.
   */
  @HostListener('window:scroll')
  onScroll(): void {
    this.updateState();
  }

  /**
   * Listener für Größenänderungen: bei jeder Änderung der Fensterbreite wird
   * der Logopfad neu ausgewählt, um die Reduktionsstufe anzupassen.
   */
  @HostListener('window:resize')
  onResize(): void {
    this.updateState();
  }

  /**
   * Aktualisiert sowohl den Shrink‑Status als auch den aktuellen Logopfad.
   */
  private updateState(): void {
    this.isShrunk = window.scrollY > this.shrinkThreshold;
    this.currentSrc = this.pickLogoForState();
  }

  /**
   * Ermittelt, ob der Benutzer ein dunkles Farbschema bevorzugt. Diese
   * Information wird für die Auswahl der passenden Logovariante benötigt.
   */
  private isDarkMode(): boolean {
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Wählt die geeignete Logostufe abhängig vom Zustand (groß/klein), der
   * Fensterbreite und dem Farbschema aus. Im nicht geschrumpften Zustand
   * wird immer die Vollversion zurückgegeben. Im geschrumpften Zustand
   * werden – falls vorhanden – die stärker reduzierten Varianten
   * bevorzugt. So kann bei sehr kleinen Breiten auf die Bildmarke
   * („1200“) zurückgegriffen werden, während bei größeren Breiten eine
   * weniger reduzierte Variante (etwa ohne „Jahre“) verwendet wird.
   */
  private pickLogoForState(): string {
    const dark = this.isDarkMode();
    const w = window.innerWidth;

    const choose = (src?: ThemeSrc) => src ? (dark ? src.dark : src.light) : '';

    // Groß: immer Vollversion
    if (!this.isShrunk) {
      return choose(this.logo.full);
    }

    // Klein: wähle zuerst die markOnly‑Variante, dann reduced2, reduced1
    if (this.logo.markOnly && (w < 340 || (!this.logo.reduced1 && !this.logo.reduced2))) {
      const candidate = choose(this.logo.markOnly);
      if (candidate) return candidate;
    }
    if (this.logo.reduced2 && (w < 380 || !this.logo.reduced1)) {
      const candidate = choose(this.logo.reduced2);
      if (candidate) return candidate;
    }
    if (this.logo.reduced1) {
      const candidate = choose(this.logo.reduced1);
      if (candidate) return candidate;
    }

    // Fallback: reduziertes Set oder Vollversion, falls keine Reduktion vorhanden
    return choose(this.logo.reduced2) || choose(this.logo.reduced1) || choose(this.logo.full);
  }
}
