import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router'
import { JwtHelperService } from '@auth0/angular-jwt'
import { CookieService } from 'ngx-cookie-service'
import { BehaviorSubject } from 'rxjs'
import { Login } from '../models/login.module'
import { SurrealdbService } from './surrealdb.service'
import { Injectable, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root',
})
export class LoginService implements CanActivate {
  // Dependency Injection mit inject()
  private readonly router = inject(Router);
  private readonly cookieService = inject(CookieService);
  private readonly surrealDBService = inject(SurrealdbService);

  // Signal für reaktiven State
  readonly isLoggedInState = signal<boolean>(false);

  // BehaviorSubject für Abwärtskompatibilität
  private readonly isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  // Signal aus Observable für Komponenten
  readonly isLoggedInSignal = toSignal(this.isLoggedIn$, { initialValue: false });

  private redirect!: unknown[];
  private readonly decoder = new JwtHelperService();

  constructor() {
    // Prüfe beim Start, ob der Benutzer eingeloggt ist
    this.checkInitialLoginState();
  }

  private async checkInitialLoginState(): Promise<void> {
    const loggedIn = await this.checkLoginStatus();
    this.isLoggedInState.set(loggedIn);
    this.isLoggedInSubject.next(loggedIn);
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
      this.router.navigate(['/'])
      return
    }
    this.router.navigate(this.redirect)
  }

  async setToken(token: string) {
    this.cookieService.set('token', token)
    const loggedIn = await this.checkLoginStatus();

    // Beide State-Mechanismen aktualisieren
    this.isLoggedInState.set(loggedIn);
    this.isLoggedInSubject.next(loggedIn);
  }

  async login(loginParams: Login): Promise<boolean> {
    const token = await this.surrealDBService.login(
      loginParams.username,
      loginParams.password,
    )

    if (!token) {
      return false
    }
    await this.setToken(token)
    return true
  }

  // Methode für Abwärtskompatibilität
  async isLoggedIn(): Promise<boolean> {
    return this.checkLoginStatus();
  }

  async checkLoginStatus(): Promise<boolean> {
    const token = this.getToken()
    if (token && (await this.surrealDBService.authenticate(token))) {
      return true
    }
    return false
  }
}
