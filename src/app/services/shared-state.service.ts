import { inject, Injectable } from '@angular/core'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { map, Observable, Subject, takeUntil } from 'rxjs'
import { ScreenSize } from '@app/models/screenSize.enum'

@Injectable({
  providedIn: 'root',
})
export class SharedStateService {
  private readonly destroy$ = new Subject<void>()

  private readonly breakpointObserver = inject(BreakpointObserver)

  getSizeOfScreen(): Observable<ScreenSize> {
    return this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .pipe(
        takeUntil(this.destroy$),
        map((result) => {
          const xSmall = result.breakpoints[Breakpoints.XSmall] ?? false
          const small = result.breakpoints[Breakpoints.Small] ?? false
          const medium = result.breakpoints[Breakpoints.Medium] ?? false
          const large = result.breakpoints[Breakpoints.Large] ?? false
          const xLarge = result.breakpoints[Breakpoints.XLarge] ?? false

          if (xSmall || small || medium) {
            return ScreenSize.SMALL
          } else if (large) {
            return ScreenSize.LARGE
          } else if (xLarge) {
            return ScreenSize.XLARGE
          } else {
            return ScreenSize.UNKNOWN
          }
        }),
      )
  }
}
