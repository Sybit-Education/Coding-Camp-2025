import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { I18nService } from '../../services/translate.service'

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center space-x-2" role="radiogroup" aria-label="Sprache auswählen" i18n-aria-label>
      <button
        *ngFor="let lang of availableLanguages"
        (click)="switchLanguage(lang)"
        [attr.aria-pressed]="currentLang === lang"
        class="w-8 h-8 rounded-full overflow-hidden border-2 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
        [class.border-blue-500]="currentLang === lang"
        [class.border-transparent]="currentLang !== lang"
        [title]="getLangTitle(lang)"
      >
        <img [src]="getFlagPath(lang)" [alt]="getLangTitle(lang)" class="w-full h-full object-cover">
      </button>
    </div>
  `,
})
export class LanguageSwitcherComponent {
  private readonly i18nService = inject(I18nService)

  currentLang = this.i18nService.getCurrentLang()
  availableLanguages = [...this.i18nService.getLangs()]

  // Mapping für Sprachen zu Flaggen und Titeln
  private readonly langMap = {
    'de': { flag: '/flags/de.svg', title: 'Deutsch' },
    'en': { flag: '/flags/gb.svg', title: 'English' },
    'fr': { flag: '/flags/fr.svg', title: 'Français' }
  };

  switchLanguage(lang: string): void {
    this.i18nService.use(lang)
    this.currentLang = lang
  }

  getFlagPath(lang: string): string {
    return this.langMap[lang as keyof typeof this.langMap]?.flag || '';
  }

  getLangTitle(lang: string): string {
    return this.langMap[lang as keyof typeof this.langMap]?.title || lang.toUpperCase();
  }
}
