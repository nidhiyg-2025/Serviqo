import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Booking {
  bookingId: number;
  bookingNumber: string;

  customer?: string;

  service: string;

  bookingDate: string;

  address: string;

  status: string;

  professional: string | null;

  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private http = inject(HttpClient);

  private apiUrl = '/api/Bookings';


  getMyBookings(): Observable<Booking[]> {

    return this.http.get<Booking[]>(
      `${this.apiUrl}/my`
    );

  }
  getAllBookings(): Observable<Booking[]> {
  return this.http.get<Booking[]>(
    `${this.apiUrl}/all`
  );
}

assignProfessional(
  bookingId: number,
  professionalId: number
): Observable<any> {

  return this.http.put(
    `${this.apiUrl}/${bookingId}/assign`,
    {
      professionalId: professionalId
    }
  );

}


updateStatus(
  bookingId: number,
  status: string
): Observable<any> {

  return this.http.put(
    `${this.apiUrl}/${bookingId}/status`,
    {
      status: status
    }
  );

}
}