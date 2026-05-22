import { Injectable, signal } from '@angular/core'

export type SnackBarType = 'success' | 'error' | 'warning' | 'info'

export interface SnackBarData {
  message: string
  type: SnackBarType
  duration?: number
}

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  // Signal-basiert OHNE RxJS
  private readonly snackBarSignal = signal<SnackBarData | null>(null)
  readonly snackBar = this.snackBarSignal.asReadonly()

  showMessage(message: string, type: SnackBarType = 'info', duration = 5000): void {
    this.snackBarSignal.set({ message, type, duration })
  }

  showSuccess(message: string, duration = 5000): void {
    this.showMessage(message, 'success', duration)
  }

  showError(message: string, duration = 5000): void {
    this.showMessage(message, 'error', duration)
  }

  showWarning(message: string, duration = 5000): void {
    this.showMessage(message, 'warning', duration)
  }

  showInfo(message: string, duration = 5000): void {
    this.showMessage(message, 'info', duration)
  }

  clear(): void {
    this.snackBarSignal.set(null)
  }
}
