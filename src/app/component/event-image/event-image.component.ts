import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, input } from '@angular/core'
import { ScreenSize } from '@app/models/screenSize.enum'
import { SharedStateService } from '@app/services/shared-state.service'
import { AsyncPipe } from '@angular/common'
import { IconComponent } from '@app/component/icon/icon.component'
import { TranslateModule } from '@ngx-translate/core'
import { MatIconModule } from '@angular/material/icon'
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y'
import { I18nService } from '@app/services/translate.service'

@Component({
  selector: 'app-event-image',
  imports: [MatIconModule, AsyncPipe, IconComponent, TranslateModule, A11yModule],
  templateUrl: './event-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventImageComponent {
  readonly images = input<{ url: string; copyright: string; creator: string }[]>([])
  readonly eventName = input<string>('')
  @ViewChild('fullscreen') fullscreen!: ElementRef<HTMLDivElement>

  readonly sharedStateService = inject(SharedStateService)
  private readonly liveAnnouncer = inject(LiveAnnouncer)
  private readonly i18n = inject(I18nService)
  screenSize = ScreenSize

  selectedImageIndex = 0

  isFullscreen = false

  openFullscreen() {
    this.isFullscreen = true
    setTimeout(() => this.fullscreen.nativeElement.focus())
    this.liveAnnouncer.announce(this.i18n.instant('event-detail.fullscreen-opened'), 'polite')
  }

  closeFullscreen() {
    this.isFullscreen = false
  }
}
