import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ProfessionalService,
  Professional
} from '../../core/services/professional.service';
import {
  BookingService,
  Booking
} from '../../core/services/booking.service';

@Component({
  selector: 'app-admin-bookings',
  imports: [CommonModule],
  templateUrl: './admin-bookings.html',
  styleUrl: './admin-bookings.css'
})
export class AdminBookings implements OnInit {

  private bookingService = inject(BookingService);

  bookings: Booking[] = [];

  loading = true;

  errorMessage = '';
private professionalService = inject(ProfessionalService);

professionals: Professional[] = [];

selectedProfessional: {
  [bookingId: number]: number
} = {};

assigning = false;

  ngOnInit(): void {

  this.loadBookings();

  this.loadProfessionals();

}

  loadProfessionals(): void {

  this.professionalService
    .getProfessionals()
    .subscribe({

      next: (data) => {

        console.log(
          'PROFESSIONALS:',
          data
        );

        this.professionals = data;

      },

      error: (error) => {

        console.error(
          'PROFESSIONAL ERROR:',
          error
        );

      }

    });

}

  loadBookings(): void {

    this.loading = true;

    this.bookingService
      .getAllBookings()
      .subscribe({

        next: (data) => {

          console.log(
            'ALL BOOKINGS:',
            data
          );

          this.bookings = data;

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'ADMIN BOOKINGS ERROR:',
            error
          );

          this.loading = false;

          if (error.status === 401) {

            this.errorMessage =
              'You are not authorized to view all bookings.';

          } else {

            this.errorMessage =
              'Unable to load bookings.';

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

  if (!date) {
    return '';
  }

  const datePart = date.split('T')[0];

  const [year, month, day] = datePart.split('-').map(Number);

  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}


formatTime(date: string): string {

  if (!date) {
    return '';
  }

  const timePart = date.split('T')[1];

  if (!timePart) {
    return '';
  }

  const [hourString, minuteString] = timePart.split(':');

  let hour = Number(hourString);

  const minute = minuteString;

  const period = hour >= 12 ? 'PM' : 'AM';

  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }

  return `${hour}:${minute} ${period}`;
}

  assignProfessional(booking: Booking): void {

  const professionalId =
    this.selectedProfessional[booking.bookingId];

  if (!professionalId) {
    return;
  }

  this.assigning = true;

  this.bookingService
    .assignProfessional(
      booking.bookingId,
      professionalId
    )
    .subscribe({

      next: (response) => {

        console.log(
          'ASSIGNMENT SUCCESS:',
          response
        );

        this.assigning = false;

        this.loadBookings();

      },

      error: (error) => {

        console.error(
          'ASSIGNMENT ERROR:',
          error
        );

        this.assigning = false;

        alert(
          error.error?.message ||
          'Unable to assign professional.'
        );

      }

    });

}

updateBookingStatus(
  booking: Booking,
  status: string
): void {

  if (!status) {
    return;
  }

  this.bookingService
    .updateStatus(
      booking.bookingId,
      status
    )
    .subscribe({

      next: (response) => {

        console.log(
          'STATUS UPDATED:',
          response
        );

        booking.status = status;

      },

      error: (error) => {

        console.error(
          'STATUS UPDATE ERROR:',
          error
        );

        alert(
          error.error?.message ||
          'Unable to update booking status.'
        );

      }

    });

}

}

