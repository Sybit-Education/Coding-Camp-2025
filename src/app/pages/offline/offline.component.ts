import { ChangeDetectionStrategy, Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-offline',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-[60vh] grid place-items-center p-6">
      <div class="max-w-md text-center space-y-4">
        <h1 class="text-2xl font-semibold">Sie sind offline</h1>
        <p class="text-gray-600">
          Keine Internetverbindung. Manche Inhalte sind eventuell nicht verfügbar.
        </p>
        <div class="flex items-center justify-center gap-3">
          <button
            type="button"
            class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            (click)="reload()"
          >
            Erneut versuchen
          </button>
          <a class="text-blue-700 underline" routerLink="/">Zur Startseite</a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineComponent {
  reload(): void {
    window.location.reload()
  }
}
