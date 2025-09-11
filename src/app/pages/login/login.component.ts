import { FormsModule } from '@angular/forms'

import { Login } from '../../models/login.module'
import { LoginService } from '../../services/login.service'
import { Component, inject } from '@angular/core'
import { SurrealdbService } from '../../services/surrealdb.service'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-page-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [FormsModule, TranslateModule],
})
export class LoginPageComponent {
  public loginParams: Login = { username: '', password: '' }
  showPassword = false
  isError = false
  unauthorizedErrorCode = 401

  private readonly surrealdbService = inject(SurrealdbService)
  private readonly loginService = inject(LoginService)

  async NgOnInit() {
    if (await this.loginService.isLoggedIn()) {
      this.loginService.switchRoute()
    }
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
