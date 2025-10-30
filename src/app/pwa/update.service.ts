import { inject, Injectable } from '@angular/core'
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker'
import { BehaviorSubject, filter } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private readonly updateAvailableSubject = new BehaviorSubject<boolean>(false)
  updateAvailable$ = this.updateAvailableSubject.asObservable()

  private readonly swUpdate: SwUpdate = inject(SwUpdate)

  constructor() {
    if (this.swUpdate.isEnabled) {
      // Abonniere Update-Events
      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY',
          ),
        )
        .subscribe(() => {
          console.log('Neue Version verfügbar')
          this.updateAvailableSubject.next(true)
        })
    }
  }

  checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false)
    }
    return this.swUpdate.checkForUpdate()
  }

  activateUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false)
    }
    return this.swUpdate.activateUpdate().then(() => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
      return true
    })
  }
}
