/**
 * Berechnet die Helligkeit einer Farbe nach dem YIQ-Algorithmus
 * Gibt einen Wert zwischen 0 (dunkel) und 255 (hell) zurück
 * 
 * @param hexColor Hexadezimale Farbdarstellung (mit oder ohne #)
 * @returns Helligkeitswert zwischen 0 und 255
 */
export function getColorBrightness(hexColor: string): number {
  // Entferne # falls vorhanden
  const color = hexColor.replace('#', '');
  
  // Konvertiere zu RGB
  const r = parseInt(color.substring(0, 2), 16) || 0;
  const g = parseInt(color.substring(2, 4), 16) || 0;
  const b = parseInt(color.substring(4, 6), 16) || 0;
  
  // Berechne Helligkeit nach YIQ-Formel
  // Diese Formel berücksichtigt die unterschiedliche Wahrnehmung von Rot, Grün und Blau
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Bestimmt, ob für eine gegebene Hintergrundfarbe weiße oder schwarze Schrift besser lesbar ist
 * 
 * @param backgroundColor Hintergrundfarbe als Hex-String (mit oder ohne #)
 * @returns 'white' oder 'black' als optimale Textfarbe
 */
export function getContrastTextColor(backgroundColor: string): 'white' | 'black' {
  const brightness = getColorBrightness(backgroundColor);
  
  // Schwellwert für Lesbarkeit (128 ist die Mitte des Helligkeitsspektrums)
  // Werte unter 128 gelten als dunkel, darüber als hell
  return brightness < 128 ? 'white' : 'black';
}
