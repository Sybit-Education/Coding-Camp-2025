import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
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
  template: `
    @if (opened()) {
      <div class="fixed inset-0 z-30 bg-black/50" aria-hidden="true"></div>
      <div class="fixed inset-0 z-40 flex items-center justify-center px-4">
        <section
          cdkTrapFocus
          role="dialog"
          class="w-full max-w-md rounded-2xl bg-white shadow-2xl focus-visible:outline-none"
          [attr.aria-modal]="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="descriptionId"
        >
          <header class="border-b border-gray-100 px-6 py-4">
            <h2 class="text-lg font-semibold text-gray-900" [id]="titleId">
              {{ title() }}
            </h2>
          </header>

          <div class="px-6 py-5 text-gray-700" [id]="descriptionId">
            <p>{{ message() }}</p>
          </div>

          <footer class="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              #cancelButton
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              (click)="handleCancel()"
            >
              {{ cancelLabel() }}
            </button>
            <button
              type="button"
              class="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              (click)="handleConfirm()"
            >
              {{ confirmLabel() }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
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
