import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import type { Event } from '../../models/event.interface'

type MinimalCategory = { name: string; color?: string | null }

interface Pill {
  label: string
  color?: string | null
  textColor: string
  slug: string
  href: string
}

/**
 * Rendert Pills (Tailwind-Stil) für event_type und topic eines Events.
 * - Klick auf eine Pill navigiert zur Kategorie-Seite: `${categoryRouteBase}/${slug}`
 * - Farben werden aus den jeweiligen Objekten (color) übernommen; Lesbarkeit via Kontrastberechnung.
 */
@Component({
  selector: 'app-event-pills',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-pills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventPillsComponent {
  @Input() event: Event | null = null

  /**
   * Basisroute für die Kategorie-Seite. Beispiel: '/kategorie'
   * Ziel-Link wird als `${categoryRouteBase}/${slug}` erzeugt.
   */
  @Input() categoryRouteBase = '/kategorie'

  get pills(): Pill[] {
    if (!this.event) return []

    const result: Pill[] = []

    const eventType = (this.event as unknown as { event_type?: MinimalCategory | null })?.event_type
    if (eventType?.name) {
      const color = eventType.color ?? null
      const label = eventType.name
      const slug = this.slugify(label)
      result.push({
        label,
        color,
        textColor: this.computeTextColor(color),
        slug,
        href: `${this.categoryRouteBase}/${slug}`,
      })
    }

    const topics = (this.event as unknown as { topic?: MinimalCategory[] | null })?.topic ?? []
    for (const t of topics) {
      if (!t?.name) continue
      const color = t.color ?? null
      const label = t.name
      const slug = this.slugify(label)
      result.push({
        label,
        color,
        textColor: this.computeTextColor(color),
        slug,
        href: `${this.categoryRouteBase}/${slug}`,
      })
    }

    return result
  }

  private slugify(name: string): string {
    const map: Record<string, string> = {
      ä: 'ae',
      ö: 'oe',
      ü: 'ue',
      Ä: 'ae',
      Ö: 'oe',
      Ü: 'ue',
      ß: 'ss',
    }
    const replaced = name
      .split('')
      .map((c) => map[c] ?? c)
      .join('')
    return replaced
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private computeTextColor(bg?: string | null): string {
    if (!bg) return '#1F2937' // Tailwind gray-800 als Standard

    const rgb = this.parseColor(bg)
    if (!rgb) return '#1F2937'

    // relative Luminanz
    const srgb = [rgb.r, rgb.g, rgb.b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
    const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]

    // Schwellenwert für Lesbarkeit
    return L > 0.55 ? '#111827' : '#FFFFFF' // gray-900 oder weiß
  }

  private parseColor(input: string): { r: number; g: number; b: number } | null {
    // #RGB oder #RRGGBB
    const hex = input.trim()
    if (/^#([0-9a-f]{3})$/i.test(hex)) {
      const [, h] = hex.match(/^#([0-9a-f]{3})$/i) as RegExpMatchArray
      const r = parseInt(h[0] + h[0], 16)
      const g = parseInt(h[1] + h[1], 16)
      const b = parseInt(h[2] + h[2], 16)
      return { r, g, b }
    }
    if (/^#([0-9a-f]{6})$/i.test(hex)) {
      const [, h] = hex.match(/^#([0-9a-f]{6})$/i) as RegExpMatchArray
      const r = parseInt(h.slice(0, 2), 16)
      const g = parseInt(h.slice(2, 4), 16)
      const b = parseInt(h.slice(4, 6), 16)
      return { r, g, b }
    }
    // rgb() oder rgba()
    const rgbMatch = input.match(/^rgba?\(\s*([.\d]+)\s*,\s*([.\d]+)\s*,\s*([.\d]+)(?:\s*,\s*[.\d]+)?\s*\)$/i)
    if (rgbMatch) {
      const r = Math.max(0, Math.min(255, Number(rgbMatch[1])))
      const g = Math.max(0, Math.min(255, Number(rgbMatch[2])))
      const b = Math.max(0, Math.min(255, Number(rgbMatch[3])))
      return { r, g, b }
    }
    return null
  }
}
