import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { I18nService } from '../services/translate.service';

/**
 * Guard, der die Sprache basierend auf der Route setzt
 */
export const languageGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const i18nService = inject(I18nService);
  const language = route.data['language'];
  
  if (language) {
    // Setze die Sprache basierend auf dem Routenpräfix, ohne Navigation
    i18nService.setLanguage(language, false);
    console.log(`Sprache auf ${language} gesetzt`);
  }
  
  return true;
};
