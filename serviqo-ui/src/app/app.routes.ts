import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home')
        .then(m => m.Home)
  },

  {
    path: 'services',
    loadComponent: () =>
      import('./pages/services/services')
        .then(m => m.Services)
  },

  {
    path: 'booking',
    loadComponent: () =>
      import('./pages/booking/booking')
        .then(m => m.Booking)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login')
        .then(m => m.Login)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register')
        .then(m => m.Register)
  },

  {
    path: 'my-bookings',
    loadComponent: () =>
      import('./pages/my-bookings/my-bookings')
        .then(m => m.MyBookings)
  },

  {
    path: 'admin-bookings',
    loadComponent: () =>
      import('./pages/admin-bookings/admin-bookings')
        .then(m => m.AdminBookings)
  },

  {
    path: 'professional-bookings',
    loadComponent: () =>
      import('./pages/professional-bookings/professional-bookings')
        .then(m => m.ProfessionalBookings)
  },

  {
    path: 'admin-professionals',
    loadComponent: () =>
      import('./pages/admin-professionals/admin-professionals')
        .then(m => m.AdminProfessionals)
  },

  // HOW IT WORKS
  {
    path: 'how-it-works',
    loadComponent: () =>
      import('./pages/how-it-works/how-it-works')
        .then(m => m.HowItWorks)
  },

  // ABOUT
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about')
        .then(m => m.About)
  }

];