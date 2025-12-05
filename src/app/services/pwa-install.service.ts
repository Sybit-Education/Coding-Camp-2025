import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  readonly showBanner = signal(false);
  private deferredPrompt: any = null;

  constructor() {
    this.detectStandaloneMode();
    this.listenForInstallPrompt();
  }

  private detectStandaloneMode() {
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIosStandalone || isStandalone) {
      this.showBanner.set(false);
      return;
    }

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) {
      this.showBanner.set(true);
    }
  }

  private listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.showBanner.set(true);
    });
  }

  install() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then(() => {
      this.deferredPrompt = null;
      this.showBanner.set(false);
      localStorage.setItem('pwa-install-dismissed', 'true');
    });
  }

  dismiss() {
    this.showBanner.set(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }

  get platform(): 'ios' | 'android' | 'desktop' {
    const ua = window.navigator.userAgent.toLowerCase();

    const isIos = /iphone|ipad|ipod/.test(ua) || (navigator as any).standalone === true;
    const isAndroid = /android/.test(ua);

    if (isIos) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  }
}
