import { Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Organizer } from '../../models/organizer.interface'
import { OrganizerService } from '../../services/organizer.service'
import { SnackBarService } from '../../services/snack-bar.service'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'

@Component({
  selector: 'app-organizer-input',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './organizer-input.component.html',
  styleUrls: ['./organizer-input.component.scss'],
})
export class OrganizerInputComponent {
  @Input() organizers: Organizer[] = []
  @Input() selectedOrganizer: Organizer | null = null
  @Output() organizerSelected = new EventEmitter<Organizer | null>()

  // Form fields
  organizername: string | null = null
  organizermail: string | null = null
  organizerphone: string | null = null
  newOrganizer = false

  // Services
  private readonly organizerService = inject(OrganizerService)
  private readonly snackBarService = inject(SnackBarService)
  private readonly markForCheck = injectMarkForCheck()

  /**
   * Setzt den ausgewählten Organizer und aktualisiert die Formularfelder
   */
  setOrganizer(organizer: Organizer | null) {
    this.selectedOrganizer = organizer
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
    this.selectedOrganizer = null
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
      this.selectedOrganizer = savedOrganizer
      this.newOrganizer = false // Formular schließen
      this.snackBarService.showSuccess('Veranstalter erfolgreich gespeichert')
      this.organizerSelected.emit(savedOrganizer)

      // Füge den neuen Organizer zur Liste hinzu, wenn er noch nicht enthalten ist
      if (!this.organizers.some((org) => org.id?.id === savedOrganizer.id?.id)) {
        this.organizers.push(savedOrganizer)
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Organizers:', error)
      this.snackBarService.showError(
        `Fehler beim Speichern des Veranstalters: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      )
      this.markForCheck()
    }
  }
}
