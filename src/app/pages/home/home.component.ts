import { Component } from '@angular/core'
import { CommonModule } from '@angular/common';
import { EventCardComponent } from "../../component/event-card/event-card.component";
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";

interface Event {
  title: string;
  date: string;
  location: string;
  price: string;
}

interface Kategorie {
  name: string;
  color: string; 
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, CommonModule, KategorieCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  events: Event[] = [
    { title: 'Konzert', date: '30.12.2025', location: 'Altstadt', price: '30€' },
    { title: 'Theater', date: '02.01.2026', location: 'Innenstadt', price: '25€' },
    { title: 'Lesung', date: '15.01.2026', location: 'Bücherei', price: '10€' },
    { title: 'Open-Air', date: '05.02.2026', location: 'Marktplatz', price: 'Gratis' },
    { title: 'Festival', date: '20.03.2026', location: 'Seeufer', price: '45€' },
  ];

  get limitedEvents(): Event[] {
    return this.events.slice(0, 4);
  }

  kategorien: Kategorie[] = [
    { name: 'Ü18' , color: 'bg-[#FF5733]' },
    { name: 'Kostenlos' , color: 'bg-[#33FF57]' },
    { name: 'Für die ganze Familie' , color: 'bg-[#3357FF]' },
    { name: 'Kultur' , color: 'bg-[#FF33A1]' },
    { name: 'Geschichte' , color: 'bg-[#FF8C33]' },
    { name: 'Entfaltung' , color: 'bg-[#33FFF5]' },
    { name: 'Barrierefrei' , color: 'bg-[#F533FF]' },
  ];

  get getKategorien(): Kategorie[] {
    return this.kategorien;
  }


}


