import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Service {
  serviceId: number;
  serviceName: string;
  description: string;
  price: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceService {

  private http = inject(HttpClient);

  private apiUrl = 'https://serviqo-rqee.onrender.com/api/Services';


  getServices(): Observable<Service[]> {

    return this.http.get<any>(this.apiUrl).pipe(

      map(response => {

        const data =
          response?.data ??
          response;

        return data.map((item: any) => ({

          serviceId:
            item.serviceId ??
            item.ServiceId,

          serviceName:
            item.serviceName ??
            item.ServiceName,

          description:
            item.description ??
            item.Description,

          price:
            item.price ??
            item.Price,

          isActive:
            item.isActive ??
            item.IsActive

        }));

      })

    );

  }


  getService(id: number): Observable<Service> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    ).pipe(

      map(item => {

        const service =
          item?.data ??
          item;

        return {

          serviceId:
            service.serviceId ??
            service.ServiceId,

          serviceName:
            service.serviceName ??
            service.ServiceName,

          description:
            service.description ??
            service.Description,

          price:
            service.price ??
            service.Price,

          isActive:
            service.isActive ??
            service.IsActive

        };

      })

    );

  }

}
