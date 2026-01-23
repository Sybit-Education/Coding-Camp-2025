import { Injectable, signal } from '@angular/core'

type Platform = 'ios' | 'android' | 'desktop'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  readonly showBanner = signal(false)
  readonly platform = signal<Platform | null>(null)

  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private readonly PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000 // 30 Tage
  private readonly STORAGE_KEY_DISMISS = 'pwa-install-dismissed-at'

  constructor() {
    this.platform.set(this.detectPlatform())
    this.checkInstallStatus()
    this.listenForInstallPrompt()
  }

  /**
   * Prüft ob App bereits installiert ist oder noch zu recent dismissed wurde
   */
  private checkInstallStatus(): void {
    // 1. Bereits als installierte App running?
    if (this.isInstalledAsApp()) {
      this.showBanner.set(false)
      return
    }

    // 2. Cooldown noch aktiv?
    if (!this.shouldShowPrompt()) {
      this.showBanner.set(false)
      return
    }

    // 3. Android/Desktop: nur zeigen wenn beforeinstallprompt Event kommt
    // iOS: wird später in listenForInstallPrompt gezeigt
    if (this.platform() === 'ios') {
      this.showBanner.set(!this.isInstalledAsApp())
    }
  }

  /**
   * Lauscht auf beforeinstallprompt Event (Android/Desktop/Chrome)
   */
  private listenForInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault()
      this.deferredPrompt = event as BeforeInstallPromptEvent

      // Nur anzeigen wenn Cooldown nicht aktiv ist
      if (this.shouldShowPrompt()) {
        this.showBanner.set(true)
      }
    })

    // Cleanup wenn App installiert wird
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null
      this.showBanner.set(false)
      localStorage.removeItem(this.STORAGE_KEY_DISMISS)
    })
  }

  /**
   * Prüft ob Cooldown abgelaufen ist
   */
  private shouldShowPrompt(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_DISMISS)
      if (!stored) {
        return true // Noch nie dismissed
      }

      const dismissedAt = parseInt(stored, 10)
      const now = Date.now()
      return now - dismissedAt > this.PROMPT_COOLDOWN_MS
    } catch {
      return true // LocalStorage nicht verfügbar → zeige prompt
    }
  }

  /**
   * Prüft ob App bereits als installierte App läuft
   */
  private isInstalledAsApp(): boolean {
    return (
      (window.navigator as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches
    )
  }

  /**
   * Zuverlässige Platform-Erkennung
   */
  private detectPlatform(): Platform {
    const ua = window.navigator.userAgent.toLowerCase()

    // Android - sehr zuverlässig
    if (/android/.test(ua)) {
      return 'android'
    }

    // iPhone/iPod - direkt
    if (/iphone|ipod/.test(ua)) {
      return 'ios'
    }

    // iPad - komplexe Erkennung (iPadOS 13+ Workaround)
    if (this.detectIPadOS(ua)) {
      return 'ios'
    }

    return 'desktop'
  }

  /**
   * iPad-Erkennung mit iPadOS 13+ Workaround
   * iPad meldet sich unter iPadOS 13+ teilweise als macOS Safari
   */
  private detectIPadOS(ua: string): boolean {
    // Explizites iPad im User-Agent
    if (/ipad/.test(ua)) {
      return true
    }

    // iPadOS 13+ meldet sich als macOS Safari
    // Aber kombiniert mit mehreren Indikatoren = iPad
    const isMacOSSafari = /mac os x/.test(ua) && /version\/\d+\./.test(ua)
    if (!isMacOSSafari) {
      return false
    }

    // Zusätzliche Checks für iPad vs. Desktop Mac
    if (!this.isTouchCapable() || !this.isWebKit(ua)) {
      return false
    }

    // iPad-spezifisches Screen-Verhältnis
    // iPad typischerweise: 1:1 bis 2:3 (kein Ultra-Widescreen)
    const screenRatio = window.innerWidth / window.innerHeight
    return screenRatio > 0.4 && screenRatio < 2.5
  }

  /**
   * Prüft Touch-Fähigkeit
   */
  private isTouchCapable(): boolean {
    const msNav = navigator as { msMaxTouchPoints?: number }
    return (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 2) ||
      (msNav.msMaxTouchPoints !== undefined && msNav.msMaxTouchPoints > 2)
    )
  }

  /**
   * Prüft ob WebKit Browser (Safari)
   */
  private isWebKit(ua: string): boolean {
    return /webkit/.test(ua) && !/chrome|firefox|edge/.test(ua)
  }

  /**
   * Triggered die Installation
   * - Android/Desktop: zeigt natives Browser Prompt
   * - iOS: wird durch UI-Component angeleitet (Share → Add to Home)
   */
  async install(): Promise<void> {
    const currentPlatform = this.platform()

    // iOS: Kann nicht direkt installiert werden
    if (currentPlatform === 'ios') {
      this.recordDismissal()
      return
    }

    // Android/Desktop: Trigger beforeinstallprompt
    if (!this.deferredPrompt) {
      console.warn('beforeinstallprompt Event nicht verfügbar')
      return
    }

    try {
      // Zeige natives Browser Prompt
      await this.deferredPrompt.prompt()

      // Warte auf User-Entscheidung
      const { outcome } = await this.deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('✅ App wurde installiert')
      } else {
        console.log('⚠️ Installation abgelehnt')
      }

      this.recordDismissal()
      this.deferredPrompt = null
      this.showBanner.set(false)
    } catch (error) {
      console.error('Installation fehlgeschlagen:', error)
      this.recordDismissal()
    }
  }

  /**
   * User hat Banner dismissed
   * Speichere Zeitstempel für 30-Tage Cooldown
   */
  dismiss(): void {
    this.recordDismissal()
    this.showBanner.set(false)
  }

  /**
   * Speichert Dismissal mit Zeitstempel
   */
  private recordDismissal(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_DISMISS, Date.now().toString())
    } catch (error) {
      console.warn('localStorage nicht verfügbar:', error)
    }
  }

  /**
   * Debug: Cooldown reset (nur für Entwicklung)
   */
  debugResetCooldown(): void {
    localStorage.removeItem(this.STORAGE_KEY_DISMISS)
    if (this.platform() !== 'ios') {
      this.showBanner.set(!!this.deferredPrompt)
    }
    console.log('✅ PWA Cooldown zurückgesetzt')
  }
}
