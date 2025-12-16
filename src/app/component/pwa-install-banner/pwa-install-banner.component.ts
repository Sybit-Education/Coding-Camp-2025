import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core'
import { PwaInstallService } from '../../services/pwa-install.service'
import { TranslateModule } from '@ngx-translate/core'
import { IconComponent } from "../icon/icon.component";

@Component({
  selector: 'app-pwa-install-banner',
  templateUrl: './pwa-install-banner.component.html',
  styleUrls: ['./pwa-install-banner.component.scss'],
  imports: [TranslateModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaInstallBannerComponent {
  private readonly pwa = inject(PwaInstallService)

  protected readonly show = this.pwa.showBanner
  protected readonly platform = this.pwa.platform
  protected readonly closing = signal(false)

  protected install() {
    this.pwa.install()
  }

  protected dismiss() {
    this.closing.set(true)
    setTimeout(() => this.pwa.dismiss(), 400)
  }
}
