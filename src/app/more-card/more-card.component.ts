import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-more-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './more-card.component.html',
  styleUrls: ['./more-card.component.scss']
})
export class MoreCardComponent {
  private readonly router = inject(Router);

  onClick() {
    this.router.navigate(['/kategorie']);
  }
}