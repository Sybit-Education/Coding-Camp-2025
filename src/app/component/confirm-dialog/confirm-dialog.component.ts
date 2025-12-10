import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core'
import { CdkTrapFocus } from '@angular/cdk/a11y'

let dialogIdCounter = 0

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule, CdkTrapFocus],
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  private readonly destroyRef = inject(DestroyRef)
  private readonly previouslyFocusedElement = signal<HTMLElement | null>(null)

  readonly opened = model<boolean>(false)
  readonly title = input<string>('')
  readonly message = input<string>('')
  readonly confirmLabel = input<string>('OK')
  readonly cancelLabel = input<string>('Abbrechen')
  readonly confirmed = output<void>()
  readonly cancelled = output<void>()

  protected readonly titleId = `confirm-dialog-title-${dialogIdCounter++}`
  protected readonly descriptionId = `confirm-dialog-description-${dialogIdCounter++}`

  protected readonly openedEffect = effect(() => {
    if (this.opened()) {
      this.previouslyFocusedElement.set(document.activeElement as HTMLElement)
      queueMicrotask(() => {
        const cancelBtn = this.cancelButton()
        cancelBtn?.nativeElement.focus()
      })
    } else {
      const previous = this.previouslyFocusedElement()
      previous?.focus()
    }
  })

  protected readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton')

  protected handleConfirm() {
    this.confirmed.emit()
    this.closeDialog()
  }

  protected handleCancel() {
    this.cancelled.emit()
    this.closeDialog()
  }

  private closeDialog() {
    this.opened.set(false)
  }
}
