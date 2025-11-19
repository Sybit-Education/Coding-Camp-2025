import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { Meta, Title } from '@angular/platform-browser'

@Component({
  selector: 'app-placeholder',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './placeholder.component.html',
})
export class PlaceholderComponent implements OnInit {
  private readonly title = inject(Title)
  private readonly meta = inject(Meta)

  ngOnInit(): void {
    // Set explicit 404 SEO hints for SPAs

    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' })
    this.meta.updateTag({ name: 'prerender-status-code', content: '404' })
    this.meta.updateTag({ name: 'description', content: 'Die angeforderte Seite wurde nicht gefunden.' })
    this.meta.updateTag({ property: 'og:title', content: 'Seite nicht gefunden' })
  }
}
