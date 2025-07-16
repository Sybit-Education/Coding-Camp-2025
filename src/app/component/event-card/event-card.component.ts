import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { Event } from '../../models/event.interface'
import { LocalStorageService } from '../../services/local-storage.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
})
export class EventCardComponent implements OnInit, OnDestroy {
  @Input() event: Event | null = null
  @Input() category = 'Heit'

  isSaved = false
  private subscription?: Subscription

  constructor(
    private readonly router: Router,
    private readonly localStorageService: LocalStorageService,
  ) {}

  ngOnInit() {
    if (this.event?.id) {
      this.isSaved = this.localStorageService.isEventSaved(this.event.id)

      this.subscription = this.localStorageService.savedEvents$.subscribe(
        () => {
          if (this.event?.id) {
            this.isSaved = this.localStorageService.isEventSaved(this.event.id)
          }
        },
      )
    }
  }

  onCardClick() {
    if (this.event?.id) {
      this.router.navigate(['/event', this.event.id])
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe()
  }
}
