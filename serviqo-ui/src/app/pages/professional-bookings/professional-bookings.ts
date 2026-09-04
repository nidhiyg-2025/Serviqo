
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/config/api.config';

interface ProfessionalBooking {
  bookingId: number;
  bookingNumber: string;
  customer: string;
  service: string;
  bookingDate: string;
  address: string;
  phone: string;
  description: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-professional-bookings',
  imports: [CommonModule],
  templateUrl: './professional-bookings.html',
  styleUrl: './professional-bookings.css'
})
export class ProfessionalBookings implements OnInit {

  private http = inject(HttpClient);

  bookings: ProfessionalBooking[] = [];

  loading = true;
  errorMessage = '';
  updatingBookingId: number | null = null;

  private apiUrl = `${API_BASE_URL}/Bookings`;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {

    this.loading = true;
    this.errorMessage = '';

    this.http.get<ProfessionalBooking[]>(
      `${this.apiUrl}/professional`
    ).subscribe({

      next: (data) => {
        console.log('PROFESSIONAL BOOKINGS:', data);

        this.bookings = data;
        this.loading = false;
      },

      error: (error) => {
        console.error('PROFESSIONAL BOOKINGS ERROR:', error);

        this.loading = false;

        if (error.status === 401) {
          this.errorMessage = 'Please login again.';
        } else if (error.status === 403) {
          this.errorMessage =
            'You are not authorized to access professional bookings.';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage =
            'Unable to load your bookings.';
        }
      }
    });
  }

  updateStatus(
    booking: ProfessionalBooking,
    status: string
  ): void {

    this.updatingBookingId = booking.bookingId;

    this.http.put<any>(
      `${this.apiUrl}/${booking.bookingId}/professional-status`,
      { status: status }
    ).subscribe({

      next: (response) => {

        console.log('STATUS UPDATED:', response);

        booking.status = status;

        this.updatingBookingId = null;
      },

      error: (error) => {

        console.error('STATUS UPDATE ERROR:', error);

        this.updatingBookingId = null;

        alert(
          error.error?.message ||
          'Unable to update booking status.'
        );
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }

  getStatusClass(status: string): string {

    switch (status) {

      case 'Assigned':
        return 'assigned';

      case 'InProgress':
        return 'in-progress';

      case 'Completed':
        return 'completed';

      case 'Cancelled':
        return 'cancelled';

      default:
        return 'pending';
    }
  }
}

