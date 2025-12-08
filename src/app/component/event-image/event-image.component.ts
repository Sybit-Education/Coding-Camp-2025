import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core'
import { ScreenSize } from '@app/models/screenSize.enum'
import { SharedStateService } from '@app/services/shared-state.service'
import { AsyncPipe } from '@angular/common'
import { IconComponent } from '@app/component/icon/icon.component'
import { TranslateModule } from '@ngx-translate/core'
import { MatIconModule } from '@angular/material/icon'
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y'

@Component({
  selector: 'app-event-image',
  imports: [MatIconModule, AsyncPipe, IconComponent, TranslateModule, A11yModule],
  templateUrl: './event-image.component.html',
})
export class EventImageComponent {
  @Input() images: { url: string; copyright: string; creator: string }[] = []
  @Input() eventName = ''
  @ViewChild('fullscreen') fullscreen!: ElementRef<HTMLDivElement>

  readonly sharedStateService = inject(SharedStateService)
  private readonly liveAnnouncer = inject(LiveAnnouncer)
  screenSize = ScreenSize

  selectedImageIndex = 0

  isFullscreen = false

  openFullscreen() {
    this.isFullscreen = true
    setTimeout(() =>this.fullscreen.nativeElement.focus())
    this.liveAnnouncer.announce('Vollbild geöffnet');
  }

  closeFullscreen() {
    this.isFullscreen = false
  }
}
