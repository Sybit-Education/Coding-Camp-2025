import { Injectable, inject } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'
import { CanActivateFn } from '@angular/router'

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title)
  private readonly meta = inject(Meta)

  /**
   * Setzt grundlegende Open Graph und Twitter Meta-Tags.
   * Falls url nicht angegeben ist, wird sie aus window.location ermittelt.
   */
  setSocialMeta(
    title: string,
    description: string,
    url?: string,
    imageUrl?: string,
    type: 'website' | 'article' = 'website',
  ): void {
    const fullTitle = `${title} - 1200 Jahre Radolfzell`
    this.title.setTitle(fullTitle)

    const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
    const ogLocale = (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'de-DE').replace(
      '-',
      '_',
    )

    const tags: Record<string, string>[] = [
      { name: 'description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: finalUrl },
      { property: 'og:site_name', content: '1200 Jahre Radolfzell' },
      { property: 'og:locale', content: ogLocale },
      { name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ]

    if (imageUrl) {
      tags.push({ property: 'og:image', content: imageUrl })
      tags.push({ property: 'og:image:alt', content: title })
      tags.push({ name: 'twitter:image', content: imageUrl })
      tags.push({ name: 'twitter:image:alt', content: title })
    }

    for (const tag of tags) {
      this.meta.updateTag(tag as any)
    }
  }
}

/**
 * Functional Guard, der anhand von Route-Data Standard-Meta-Tags setzt.
 * Nutzung: canActivate: [metaGuard], data: { meta: { title, description, image?, type? } }
 */
export const metaGuard: CanActivateFn = (route, state) => {
  const seo = inject(SeoService)
  const data = (route.data?.['meta'] || {}) as {
    title?: string
    description?: string
    image?: string
    type?: 'website' | 'article'
  }

  const title = data.title || route.title || '1200 Jahre Radolfzell'
  const description = data.description || 'Informationen und Veranstaltungen zum Jubiläum 1200 Jahre Radolfzell.'
  const fullUrl = typeof window !== 'undefined' ? window.location.origin + state.url : state.url
  seo.setSocialMeta(title, description, fullUrl, data.image, data.type || 'website')
  return true
}
