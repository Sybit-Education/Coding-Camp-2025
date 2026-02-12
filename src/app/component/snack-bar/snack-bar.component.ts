import { Component, inject, signal, effect, DestroyRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { SnackBarService, SnackBarType } from '../../services/snack-bar.service'
import { animate, state, style, transition, trigger } from '@angular/animations'

@Component({
  selector: 'app-snack-bar',
  imports: [CommonModule, TranslateModule],
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.scss'],
  animations: [
    trigger('snackBarState', [
      state(
        'void',
        style({
          transform: 'translateX(100%)',
          opacity: 0,
        }),
      ),
      state(
        'visible',
        style({
          transform: 'translateX(0)',
          opacity: 1,
        }),
      ),
      transition('void => visible', animate('200ms ease-out')),
      transition('visible => void', animate('200ms ease-in')),
    ]),
  ],
})
export class SnackBarComponent {
  private readonly snackBarService = inject(SnackBarService)
  private readonly destroyRef = inject(DestroyRef)

  visible = signal(false)
  message = signal('')
  type = signal<SnackBarType>('info')

  private timeoutId: number | null = null

  constructor() {
    // Effect to react to snackBar signal changes - NO RxJS
    effect(() => {
      const data = this.snackBarService.snackBar()
      if (data) {
        this.message.set(data.message)
        this.type.set(data.type)
        this.visible.set(true)

        // Clear previous timeout if exists
        if (this.timeoutId !== null) {
          window.clearTimeout(this.timeoutId)
        }

        // Auto-hide after timeout
        this.timeoutId = window.setTimeout(() => {
          this.visible.set(false)
          this.timeoutId = null
        }, data.duration || 5000)
      }
    })

    // Cleanup timeout on destroy
    this.destroyRef.onDestroy(() => {
      if (this.timeoutId !== null) {
        window.clearTimeout(this.timeoutId)
      }
    })
  }

  getTypeClass(): string {
    switch (this.type()) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  getIcon(): string {
    switch (this.type()) {
      case 'success':
        return 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
      case 'error':
        return 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
      case 'warning':
        return 'M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995A.905.905 0 018 5zm.002 6a1 1 0 110 2 1 1 0 010-2z'
      case 'info':
      default:
        return 'M8 16A8 8 0 108 0a8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 9a1 1 0 100-2 1 1 0 000 2z'
    }
  }

  close(): void {
    this.visible.set(false)
  }
}
