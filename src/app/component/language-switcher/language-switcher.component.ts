import { Component, inject } from '@angular/core'
import { I18nService } from '../../services/translate.service'

@Component({
  selector: 'app-language-switcher',
  imports: [],
  templateUrl: './language-switcher.component.html',
})
export class LanguageSwitcherComponent {
  private readonly i18nService = inject(I18nService)

  currentLang = this.i18nService.getCurrentLang()
  availableLanguages = [...this.i18nService.getLangs()]

  // Mapping für Sprachen zu Flaggen und Titeln
  private readonly langMap = {
    'de': { flag: '/flags/de.svg', title: 'Deutsch' },
    'en': { flag: '/flags/gb.svg', title: 'English' },
    'fr': { flag: '/flags/fr.svg', title: 'Français' },
  }

  switchLanguage(lang: string): void {
    this.i18nService.use(lang)
    this.currentLang = lang
  }

  getFlagPath(lang: string): string {
    return this.langMap[lang as keyof typeof this.langMap]?.flag || ''
  }

  getLangTitle(lang: string): string {
    return this.langMap[lang as keyof typeof this.langMap]?.title || lang.toUpperCase()
  }
}
