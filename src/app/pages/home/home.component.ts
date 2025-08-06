import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';

interface DummyEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  price: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  events: DummyEvent[] = [
    {
      id: 'gi9bmmtwk2xjgwdk9jgx', // echte Event-ID für Routing
      title: 'Konzert am See',
      date: '30.12.2025',
      location: 'Altstadt',
      price: '30€',
    },
    {
      id: 'dummy-2',
      title: 'Theaterabend',
      date: '01.01.2026',
      location: 'Innenstadt',
      price: '25€',
    },
  ];
}