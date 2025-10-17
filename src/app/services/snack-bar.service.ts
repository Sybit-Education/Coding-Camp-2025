import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type SnackBarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackBarData {
  message: string;
  type: SnackBarType;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {
  private readonly snackBarSubject = new Subject<SnackBarData | null>();
  snackBar$ = this.snackBarSubject.asObservable();

  showMessage(message: string, type: SnackBarType = 'info', duration = 5000): void {
    this.snackBarSubject.next({ message, type, duration });
  }

  showSuccess(message: string, duration = 5000): void {
    this.showMessage(message, 'success', duration);
  }

  showError(message: string, duration = 5000): void {
    this.showMessage(message, 'error', duration);
  }

  showWarning(message: string, duration = 5000): void {
    this.showMessage(message, 'warning', duration);
  }

  showInfo(message: string, duration = 5000): void {
    this.showMessage(message, 'info', duration);
  }

  clear(): void {
    this.snackBarSubject.next(null);
  }
}
