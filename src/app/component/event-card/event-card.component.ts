import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Event, EventType } from '../../models/event.interface';
import { Location } from '../../models/location.interface';
import { DateTimeRangePipe } from '../../services/date.pipe';
import { SurrealdbService } from '../../services/surrealdb.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { MediaService } from '../../services/media.service';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, DateTimeRangePipe],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent implements OnInit, OnDestroy {
  @Input() event: Event | null = null;

  location: Location | null = null;
  eventType: EventType | null = null;
  isSaved = false;
  mediaUrl = '';

  private subscription?: Subscription;

  private readonly surrealDBService = inject(SurrealdbService);
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly mediaService = inject(MediaService);

  ngOnInit(): void {
    if (this.event?.id) {
      this.initializeSavedState();
      this.initializeEventDetails();
    }
    
    // Setze Media URL (mit Fallback)
    this.mediaUrl = this.mediaService.getMediaUrlFromString(
      this.event?.media?.[0]?.file || (this.event?.media as any)
    );
  }

  private initializeSavedState(): void {
    if (!this.event?.id) return;

    const eventId = this.event.id as unknown as string;
    this.isSaved = this.localStorageService.isEventSaved(eventId);

    this.subscription = this.localStorageService.savedEvents$.subscribe(() => {
      this.isSaved = this.localStorageService.isEventSaved(eventId);
    });
  }

  private async initializeEventDetails(): Promise<void> {
    if (!this.event) return;

    try {
      // Parallel laden von Location und EventType
      const [location, eventType] = await Promise.all([
        this.loadLocation(),
        this.loadEventType()
      ]);

      this.location = location;
      this.eventType = eventType;
    } catch (error) {
      console.warn('Fehler beim Laden der Event-Details:', error);
    }
  }

  private async loadLocation(): Promise<Location | null> {
    if (!this.event?.location) return null;
    
    try {
      const locationId = this.event.location as unknown as string;
      return await this.surrealDBService.getById<Location>(locationId);
    } catch (error) {
      console.warn('Fehler beim Laden der Location:', error);
      return null;
    }
  }

  private async loadEventType(): Promise<EventType | null> {
    if (!this.event?.event_type) return null;

    try {
      const typeId = this.event.event_type as unknown as string;
      const result = await this.surrealDBService.getById<{name: string}>(typeId);
      return (result?.name as EventType) || EventType.UNKNOWN;
    } catch (error) {
      console.warn('Fehler beim Laden des Event Types:', error);
      return EventType.UNKNOWN;
    }
  }

  onCardClick(): void {
    if (!this.event?.id) return;

    // ID bereinigen falls nötig
    const eventId = this.event.id as unknown as string;
    const cleanedId = eventId.replace(/^event:/, '');
    
    this.router.navigate(['/event', cleanedId]);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}