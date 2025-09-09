import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router'
import { JwtHelperService } from '@auth0/angular-jwt'
import { CookieService } from 'ngx-cookie-service'
import { BehaviorSubject } from 'rxjs'
import { Login } from '../models/login.module'
import { SurrealdbService } from './surrealdb.service'
import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class LoginService implements CanActivate {
  private readonly isLoggedInSubject = new BehaviorSubject<boolean>(false)
  isLoggedIn$ = this.isLoggedInSubject.asObservable()
  private redirect!: unknown[]
  private readonly decoder = new JwtHelperService()

  constructor(
    private readonly router: Router,
    private readonly cookieService: CookieService,
    private readonly surrealDBService: SurrealdbService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = this.getToken()

    if (token && !this.decoder?.isTokenExpired(token)) {
      return true
    }

    this.cookieService.delete('token')

    const redirect = Object.values(route.url).map((object) => {
      return object.path
    })

    if (redirect.length > 0 && redirect[0] !== 'login') {
      this.redirect = redirect
    }

    this.router.navigate(['login'])

    return false
  }

  getToken(): string {
    return this.cookieService.get('token') ?? ''
  }

  switchRoute() {
    if (this.redirect == null) {
      // Leite den Benutzer direkt zur Admin-Seite weiter
      this.router.navigate(['/admin'])
      return
    }
    this.router.navigate(this.redirect)
  }

  async setToken(token: string) {
    this.cookieService.set('token', token)
    this.isLoggedInSubject.next(await this.isLoggedIn())
  }

  async login(loginParams: Login): Promise<boolean> {
    const token = await this.surrealDBService.login(
      loginParams.username,
      loginParams.password,
    )

    if (!token) {
      return false
    }
    this.setToken(token)
    return true
  }

  async isLoggedIn(): Promise<boolean> {
    const token = this.getToken()
    if (token && (await this.surrealDBService.authenticate(token))) {
      return true
    }
    return false
  }
}
