import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SeoInitializerService } from '../services/seo-initializer.service';

/**
 * Guard, der die SEO-Metadaten für jede Route setzt
 */
export const seoGuard: CanActivateFn = (route, state) => {
  const seoInitializer = inject(SeoInitializerService);
  return seoInitializer.initializeMetaTags(route, state);
};
