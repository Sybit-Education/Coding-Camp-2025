import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { I18nService } from '../../services/translate.service'

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center space-x-2" role="radiogroup" aria-label="Sprache auswählen">
      <button
        *ngFor="let lang of availableLanguages"
        (click)="switchLanguage(lang)"
        [attr.aria-pressed]="currentLang === lang"
        class="px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        [class.bg-blue-500]="currentLang === lang"
        [class.text-white]="currentLang === lang"
        [class.bg-gray-200]="currentLang !== lang"
      >
        {{ lang.toUpperCase() }}
      </button>
    </div>
  `,
})
export class LanguageSwitcherComponent {
  private i18nService = inject(I18nService)
  
  currentLang = this.i18nService.getCurrentLang()
  availableLanguages = this.i18nService.getLangs()

  switchLanguage(lang: string): void {
    this.i18nService.use(lang)
    this.currentLang = lang
  }
}
