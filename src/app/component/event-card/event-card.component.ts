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
      const cleanedId = this.eventId.replace(/^event:/, '');
      this.router.navigate(['/event', cleanedId]);
    }
  }
}