import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Professional {
  professionalId: number;
  userId?: number;
  fullName: string;
  email?: string;
  phone: string;
  specialization: string;
  isAvailable: boolean;
}

export interface CreateProfessional {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  specialization: string;
  isAvailable: boolean;
}

export interface UpdateProfessional {
  fullName: string;
  phone: string;
  specialization: string;
  isAvailable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfessionalService {

  private http = inject(HttpClient);

  private apiUrl = '/api/Professionals';

  // GET ALL PROFESSIONALS
  getProfessionals(): Observable<Professional[]> {

    return this.http.get<Professional[]>(
      this.apiUrl
    );

  }

  // GET PROFESSIONAL BY ID
  getProfessional(
    id: number
  ): Observable<Professional> {

    return this.http.get<Professional>(
      `${this.apiUrl}/${id}`
    );

  }

  // CREATE PROFESSIONAL + LOGIN ACCOUNT
  createProfessional(
    professional: CreateProfessional
  ): Observable<any> {

    return this.http.post(
      this.apiUrl,
      professional
    );

  }

  // UPDATE PROFESSIONAL
  updateProfessional(
    id: number,
    professional: UpdateProfessional
  ): Observable<Professional> {

    return this.http.put<Professional>(
      `${this.apiUrl}/${id}`,
      professional
    );

  }

  // UPDATE AVAILABILITY
  updateAvailability(
    id: number,
    available: boolean
  ): Observable<any> {

    return this.http.patch(
      `${this.apiUrl}/${id}/availability`,
      null,
      {
        params: {
          available: available.toString()
        }
      }
    );

  }

}