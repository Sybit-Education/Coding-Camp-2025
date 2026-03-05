import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { I18nService } from '../../services/translate.service'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-language-switcher',
  imports: [TranslateModule],
  templateUrl: './language-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  handleArrow(currentIndex: number, delta: number, event: KeyboardEvent) {
    event.preventDefault()
    const langs = this.availableLanguages
    if (!langs.length) return
    const nextIndex = (currentIndex + delta + langs.length) % langs.length
    this.switchLanguage(langs[nextIndex])
  }
}
