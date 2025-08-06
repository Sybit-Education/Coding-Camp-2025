import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  @Input() title: string = '';
  @Input() eventId?: string;

  constructor(private router: Router) {}

  onCardClick() {
    if (this.eventId) {
      this.router.navigate(['/event', this.eventId]);
    }
  }
}