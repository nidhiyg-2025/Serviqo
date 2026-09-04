import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/config/api.config';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  private http = inject(HttpClient);
  private router = inject(Router);

  fullName = '';
  email = '';
  phone = '';
  password = '';

  loading = false;

  errorMessage = '';
  successMessage = '';

  private apiUrl = `${API_BASE_URL}/Auth`;

  register(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.fullName ||
      !this.email ||
      !this.phone ||
      !this.password
    ) {
      this.errorMessage =
        'Please fill in all required fields.';

      return;
    }

    this.loading = true;

    const registerData = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      password: this.password
    };

    this.http
      .post<any>(
        `${this.apiUrl}/register`,
        registerData
      )
      .subscribe({

        next: (response) => {

          console.log(
            'REGISTER SUCCESS:',
            response
          );

          this.loading = false;

          this.successMessage =
            response?.message ||
            'Account created successfully!';

          setTimeout(() => {

            this.router.navigate(['/login']);

          }, 1500);

        },

        error: (error) => {

          console.error(
            'REGISTER ERROR:',
            error
          );

          this.loading = false;

          if (error.error?.message) {

            this.errorMessage =
              error.error.message;

          } else {

            this.errorMessage =
              'Unable to create account. Please try again.';

          }

        }

      });
  }
}