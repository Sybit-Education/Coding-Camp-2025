import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router'
import { JwtHelperService } from '@auth0/angular-jwt'
import { CookieService } from 'ngx-cookie-service'
import { Login } from '../models/login.module'
import { SurrealdbService } from './surrealdb.service'
import { Injectable, inject, signal } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class LoginService implements CanActivate {
  // Dependency Injection mit inject()
  private readonly router = inject(Router)
  private readonly cookieService = inject(CookieService)
  private readonly surrealDBService = inject(SurrealdbService)

  // Signal für reaktiven State - OHNE RxJS
  readonly isLoggedInState = signal<boolean>(false)

  private redirect!: unknown[]
  private readonly decoder = new JwtHelperService()

  async checkInitialLoginState(): Promise<void> {
    try {
      const loggedIn = await this.checkLoginStatus()
      this.isLoggedInState.set(loggedIn)
    } catch (error) {
      console.error('Login state check failed:', error)
      this.setToken('')
      this.isLoggedInState.set(false)
    }
  }

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
    const loggedIn = await this.checkLoginStatus()
    this.isLoggedInState.set(loggedIn)
  }

  async login(loginParams: Login): Promise<boolean> {
    const token = await this.surrealDBService.login(loginParams.username, loginParams.password)

    if (!token) {
      return false
    }
    await this.setToken(token)
    return true
  }

  async isLoggedIn(): Promise<boolean> {
    return this.checkLoginStatus()
  }

  async checkLoginStatus(): Promise<boolean> {
    const token = this.getToken()
    if (!token) {
      return false
    }

    // Check if token is expired using the decoder
    if (this.decoder.isTokenExpired(token)) {
      console.info('Token is expired, clearing token')
      this.cookieService.delete('token')
      return false
    }

    try {
      // Only try to authenticate with SurrealDB if token isn't expired
      return await this.surrealDBService.authenticate(token)
    } catch (error) {
      console.error('Authentication failed or token invalid/expired:', error)
      // Clear the token if authentication fails
      this.cookieService.delete('token')
      return false
    }
  }
}
