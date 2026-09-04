import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  BookingService,
  Booking
} from '../../core/services/booking.service';

@Component({
  selector: 'app-my-bookings',

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css'
})
export class MyBookings implements OnInit {

  private bookingService = inject(BookingService);

  bookings: Booking[] = [];

  loading = true;

  errorMessage = '';


  ngOnInit(): void {

    this.loadBookings();

  }


  loadBookings(): void {

    this.loading = true;

    this.errorMessage = '';

    this.bookingService
      .getMyBookings()
      .subscribe({

        next: (data) => {

          console.log(
            'MY BOOKINGS:',
            data
          );

          this.bookings = data;

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'BOOKINGS ERROR:',
            error
          );

          this.loading = false;

          if (error.status === 401) {

            this.errorMessage =
              'Please login to view your bookings.';

          } else {

            this.errorMessage =
              'Unable to load your bookings.';

          }

        }

      });

  }


  getStatusClass(status: string): string {

    return status
      .toLowerCase()
      .replace(/\s+/g, '-');

  }


  formatDate(date: string): string {

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  formatTime(date: string): string {

    return new Date(date).toLocaleTimeString(
      'en-IN',
      {
        hour: 'numeric',
        minute: '2-digit'
      }
    );

  }

}