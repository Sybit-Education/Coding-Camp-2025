import { FormsModule } from '@angular/forms'

import { Login } from '../../models/login.module'
import { LoginService } from '../../services/login.service'
import { Component, inject, OnInit } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

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

    const result = await this.loginService.login(this.loginParams)

    if (!result) {
      this.isError = true
      return
    }
    this.loginService.switchRoute()
  }
}
