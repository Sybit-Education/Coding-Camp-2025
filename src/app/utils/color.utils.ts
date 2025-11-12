/**
 * Berechnet die optimale Textfarbe (schwarz oder weiß) für einen gegebenen Hintergrund
 * Standart ist dunkelgrau (#1F2937)
 * 
 * @param bg Hintergrundfarbe als Hex-String (mit oder ohne #)
 * @returns 'white' oder 'black' als optimale Textfarbe
 */
export function computeTextColor(bg?: string | null): string {
    if (!bg) return '#1F2937' // Tailwind gray-800 als Standard

    const rgb = parseColor(bg)
    if (!rgb) return '#1F2937'

    // relative Luminanz
    const srgb = [rgb.r, rgb.g, rgb.b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
    const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]

    // Schwellenwert für Lesbarkeit
    return L > 0.55 ? '#111827' : '#FFFFFF' // gray-900 oder weiß
  }

  /**
   * Parst eine Farbdefinition in das RGB-Format
   * 
   * @param input hex (#RRGGBB, #RGB) oder rgb()/rgba() String
   * @returns Array mit r, g, b Werten oder null bei ungültiger Eingabe
   */
  export function parseColor(input: string): { r: number; g: number; b: number } | null {
    // #RGB oder #RRGGBB
    const hex = input.trim()
    if (/^#([0-9a-f]{3})$/i.test(hex)) {
      const [, h] = new RegExp(/^#([0-9a-f]{3})$/i).exec(hex) as RegExpMatchArray
      const r = Number.parseInt(h[0] + h[0], 16)
      const g = Number.parseInt(h[1] + h[1], 16)
      const b = Number.parseInt(h[2] + h[2], 16)
      return { r, g, b }
    }
    if (/^#([0-9a-f]{6})$/i.test(hex)) {
      const [, h] = new RegExp(/^#([0-9a-f]{6})$/i).exec(hex) as RegExpMatchArray
      const r = Number.parseInt(h.slice(0, 2), 16)
      const g = Number.parseInt(h.slice(2, 4), 16)
      const b = Number.parseInt(h.slice(4, 6), 16)
      return { r, g, b }
    }
    // rgb() oder rgba()
    const rgbMatch = new RegExp(/^rgba?\(\s*([.\d]+)\s*,\s*([.\d]+)\s*,\s*([.\d]+)(?:\s*,\s*[.\d]+)?\s*\)$/i).exec(input)
    if (rgbMatch) {
      const r = Math.max(0, Math.min(255, Number(rgbMatch[1])))
      const g = Math.max(0, Math.min(255, Number(rgbMatch[2])))
      const b = Math.max(0, Math.min(255, Number(rgbMatch[3])))
      return { r, g, b }
    }
    return null
  }
