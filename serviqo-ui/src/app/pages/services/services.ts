import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServiceService, Service } from '../../core/services/service';

@Component({
  selector: 'app-services',
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrl: './services.css'
})
export class Services implements OnInit {

  private serviceService = inject(ServiceService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  services: Service[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.errorMessage = '';

    this.serviceService.getServices().subscribe({
      next: (data) => {
        this.services = data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('SERVICE API ERROR:', error);
        this.loading = false;
        this.errorMessage =
          'Unable to load services. Make sure the API is running and restart the Angular dev server.';
        this.cdr.detectChanges();
      }
    });
  }

  bookService(service: Service): void {

    this.router.navigate(['/booking'], {
      queryParams: {
        serviceId: service.serviceId
      }
    });

  }
}