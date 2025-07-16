import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LocalStorageService } from '../../services/local-storage.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-save-event-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './save-event-button.component.html',
  styleUrl: './save-event-button.component.scss',
})
export class SaveEventButtonComponent implements OnInit, OnDestroy {
  @Input() eventId: string | null = null
  @Input() size: 'small' | 'large' = 'large'

  isSaved = false
  private subscription?: Subscription

  constructor(private localStorageService: LocalStorageService) {}

  ngOnInit() {
    if (this.eventId) {
      this.isSaved = this.localStorageService.isEventSaved(this.eventId)

      this.subscription = this.localStorageService.savedEvents$.subscribe(
        () => {
          if (this.eventId) {
            this.isSaved = this.localStorageService.isEventSaved(this.eventId)
          }
        },
      )
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe()
  }

  toggleSave() {
    if (!this.eventId) return

    if (this.isSaved) {
      this.localStorageService.unsaveEvent(this.eventId)
    } else {
      this.localStorageService.saveEvent(this.eventId)
    }
  }

  getButtonClass(): string {
    const baseClasses =
      'inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg'

    if (this.size === 'small') {
      return `${baseClasses} px-3 py-2 text-sm`
    } else {
      return `${baseClasses} px-6 py-3 text-base`
    }
  }

  getButtonColors(): string {
    if (this.isSaved) {
      return 'bg-yellow-400 text-indigo-900 hover:bg-yellow-500 border-2 border-yellow-400'
    } else {
      return 'bg-white text-indigo border-2 border-indigo hover:bg-indigo-50'
    }
  }
}
