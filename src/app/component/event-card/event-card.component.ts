import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'
import { DateTimeRangePipe } from '../../services/date.pipe';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, DateTimeRangePipe],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  @Input() title = '';
  @Input() eventId?: string;

  @Input() date_start: string | Date | null = null;
  @Input() date_end?: string | Date | null;

  @Input() locationName = '';

  constructor(private router: Router) {}

  onCardClick() {
    if (this.eventId) {
      const cleanedId = this.eventId.replace(/^event:/, '');
      this.router.navigate(['/event', cleanedId]);
    }
  }
}