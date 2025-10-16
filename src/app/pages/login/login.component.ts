import { FormsModule } from '@angular/forms'

import { Login } from '../../models/login.module'
import { LoginService } from '../../services/login.service'
import { Component, inject, OnInit } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { SnackBarService } from '../../services/snack-bar.service'

@Component({
  selector: 'app-page-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [FormsModule, TranslateModule],
})
export class LoginPageComponent implements OnInit {
  public loginParams: Login = { username: '', password: '' }
  showPassword = false
  isError = false
  unauthorizedErrorCode = 401

  private readonly loginService = inject(LoginService)
  private readonly snackBarService = inject(SnackBarService)

  ngOnInit(): void {
    this.loginService.isLoggedIn().then((isLoggedIn) => {
      if (isLoggedIn) {
        this.loginService.switchRoute()
      }
    })
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword
  }

  async handleLogin() {
    this.isError = false

    try {
      const result = await this.loginService.login(this.loginParams)

      if (!result) {
        this.isError = true
        this.snackBarService.showError('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.')
        return
      }
      this.snackBarService.showSuccess('Login erfolgreich')
      this.loginService.switchRoute()
    } catch (error) {
      this.isError = true
      console.error('Fehler beim Login:', error)
      this.snackBarService.showError(`Fehler beim Login: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }
}
