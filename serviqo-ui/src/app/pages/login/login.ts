import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/config/api.config';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private http = inject(HttpClient);
  private router = inject(Router);

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

  private apiUrl = `${API_BASE_URL}/Auth`;

  login(): void {

    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.loading = true;

    this.http.post<any>(
      `${this.apiUrl}/login`,
      {
        email: this.email,
        password: this.password
      }
    ).subscribe({

      next: (response) => {

  localStorage.setItem('token', response.token);
  localStorage.setItem('role', response.role);
  localStorage.setItem('user', JSON.stringify(response));

  if (response.role === 'Admin') {

    this.router.navigate(['/admin-bookings']);

  } else {

    this.router.navigate(['/services']);

  }

},

      error: (error) => {

        console.error(error);

        this.loading = false;

        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage =
            'Unable to login. Please try again.';
        }
      }
    });
  }
}