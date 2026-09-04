import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  NavigationEnd
} from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  role: string = '';
  loggedIn: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {

    this.updateNavbar();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updateNavbar();
      });

  }

  updateNavbar(): void {

    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    this.loggedIn = !!token;

    // Keep role in the same format used in navbar.html
    if (storedRole) {

      const normalizedRole =
        storedRole.trim().toLowerCase();

      if (normalizedRole === 'admin') {
        this.role = 'Admin';
      }
      else if (normalizedRole === 'customer') {
        this.role = 'Customer';
      }
      else if (normalizedRole === 'professional') {
        this.role = 'Professional';
      }
      else {
        this.role = '';
      }

    }
    else {
      this.role = '';
    }

    console.log('========== NAVBAR ==========');
    console.log('Token:', token);
    console.log('Logged In:', this.loggedIn);
    console.log('Stored Role:', storedRole);
    console.log('Navbar Role:', this.role);
    console.log('============================');

  }

  isCustomer(): boolean {
    return this.loggedIn && this.role === 'Customer';
  }

  isProfessional(): boolean {
    return this.loggedIn && this.role === 'Professional';
  }

  isAdmin(): boolean {
    return this.loggedIn && this.role === 'Admin';
  }

  logout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');

    this.role = '';
    this.loggedIn = false;

    this.router.navigate(['/home']);

  }

}