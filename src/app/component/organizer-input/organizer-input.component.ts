import { Component, input, output, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core'

import { FormsModule } from '@angular/forms'
import { TranslatePipe } from '@ngx-translate/core'
import { Organizer } from '../../models/organizer.interface'
import { OrganizerService } from '../../services/organizer.service'
import { SnackBarService } from '../../services/snack-bar.service'

@Component({
  selector: 'app-organizer-input',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './organizer-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./organizer-input.component.scss'],
})
export class OrganizerInputComponent {
  readonly organizers = input<Organizer[]>([])
  readonly selectedOrganizer = input<Organizer | null>(null)
  readonly organizerSelected = output<Organizer | null>()

  // Lokale, mutable Kopie der Organizer-Liste
  protected organizerList = signal<Organizer[]>([])

  // Form fields
  organizername: string | null = null
  organizermail: string | null = null
  organizerphone: string | null = null
  newOrganizer = false

  // Services
  private readonly organizerService = inject(OrganizerService)
  private readonly snackBarService = inject(SnackBarService)

  constructor() {
    // Sync vom Input in die lokale Signal-Liste
    effect(() => {
      this.organizerList.set(this.organizers())
    })
  }

  /**
   * Setzt den ausgewählten Organizer und aktualisiert die Formularfelder
   */
  setOrganizer(organizer: Organizer | null) {
    if (organizer) {
      this.organizername = organizer.name
      this.organizerphone = organizer.phonenumber ?? null
      this.organizermail = organizer.email ?? null
    }
    this.organizerSelected.emit(organizer)
  }

  /**
   * Zeigt das Formular zum Erstellen eines neuen Organizers an
   */
  showNewOrganizerForm() {
    this.newOrganizer = true
    this.organizername = null
    this.organizermail = null
    this.organizerphone = null
    this.organizerSelected.emit(null)
  }

  /**
   * Bricht die Erstellung eines neuen Organizers ab
   */
  cancelNewOrganizer() {
    this.newOrganizer = false
  }

  /**
   * Speichert einen neuen Organizer
   */
  async saveOrganizer() {
    if (!this.organizername && !this.organizermail && !this.organizerphone) {
      this.snackBarService.showError('Bitte mindestens einen Wert für den Veranstalter eingeben!')
      return
    }

    const organizer: Organizer = {
      name: this.organizername || '',
      email: this.organizermail || undefined,
      phonenumber: this.organizerphone || undefined,
    }

    try {
      const savedOrganizer = await this.organizerService.create(organizer)
      this.newOrganizer = false // Formular schließen
      this.snackBarService.showSuccess('Veranstalter erfolgreich gespeichert')
      this.organizerSelected.emit(savedOrganizer)

      // Füge den neuen Organizer zur lokalen Liste hinzu
      this.organizerList.update((list) => {
        if (list.some((org) => org.id?.id === savedOrganizer.id?.id)) {
          return list
        }
        return [...list, savedOrganizer]
      })
    } catch (error) {
      console.error('Fehler beim Speichern des Organizers:', error)
      this.snackBarService.showError(
        `Fehler beim Speichern des Veranstalters: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      )
    }
  }
}
