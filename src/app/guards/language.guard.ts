import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { I18nService } from '../services/translate.service';

/**
 * Guard zur Überprüfung und Verwaltung der Spracheinstellung in der URL
 */
export const languageGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const i18nService = inject(I18nService);
  
  // Verfügbare Sprachen
  const availableLanguages = ['de', 'en', 'fr'];
  
  // Prüfen, ob das erste Segment eine gültige Sprache ist
  const lang = route.params['lang'];
  
  if (lang && availableLanguages.includes(lang)) {
    // Wenn eine gültige Sprache in der URL ist, setze diese Sprache
    i18nService.setLanguage(lang, false);
    return true;
  } else if (route.routeConfig?.path === '') {
    // Wenn wir auf der Root-Route sind, leite zur deutschen Version weiter
    router.navigateByUrl('/de');
    return false;
  } else if (route.routeConfig?.path === '**') {
    // Wildcard-Route, leite zur deutschen Version weiter
    router.navigateByUrl('/de');
    return false;
  }
  
  return true;
};
