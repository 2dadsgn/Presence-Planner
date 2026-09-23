import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

import {environment} from '../../../environments/environment.prod';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);

  readonly currentYear = new Date().getFullYear();

  readonly companySignature = environment.company_signature;

  signIn(): void {
    this.auth.login();
  }
}
