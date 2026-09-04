import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NgForm
} from '@angular/forms';

import {
  ProfessionalService,
  Professional,
  CreateProfessional,
  UpdateProfessional
} from '../../core/services/professional.service';

@Component({
  selector: 'app-admin-professionals',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-professionals.html',
  styleUrl: './admin-professionals.css'
})
export class AdminProfessionals implements OnInit {

  private professionalService =
    inject(ProfessionalService);


  // ==========================================
  // DATA
  // ==========================================

  professionals: Professional[] = [];


  // ==========================================
  // PAGE STATES
  // ==========================================

  loading = true;

  submitting = false;

  errorMessage = '';

  successMessage = '';


  // ==========================================
  // FORM STATES
  // ==========================================

  showForm = false;

  editing = false;

  editingProfessionalId: number | null = null;


  // ==========================================
  // CREATE FORM
  // ==========================================

  newProfessional: CreateProfessional = {

    fullName: '',

    email: '',

    phone: '',

    password: '',

    specialization: 'Plumbing',

    isAvailable: true

  };


  // ==========================================
  // UPDATE FORM
  // ==========================================

  updateProfessionalData: UpdateProfessional = {

    fullName: '',

    phone: '',

    specialization: 'Plumbing',

    isAvailable: true

  };


  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {

    this.loadProfessionals();

  }


  // ==========================================
  // LOAD PROFESSIONALS
  // ==========================================

  loadProfessionals(): void {

    this.loading = true;

    this.errorMessage = '';

    this.professionalService
      .getProfessionals()
      .subscribe({

        next: (data) => {

          console.log(
            'PROFESSIONALS:',
            data
          );

          this.professionals = data;

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'PROFESSIONAL ERROR:',
            error
          );

          this.loading = false;

          if (error.status === 401) {

            this.errorMessage =
              'You are not authorized to manage professionals.';

          }
          else if (error.status === 403) {

            this.errorMessage =
              'Only Admin users can manage professionals.';

          }
          else {

            this.errorMessage =
              'Unable to load professionals.';

          }

        }

      });

  }


  // ==========================================
  // OPEN ADD FORM
  // ==========================================

  openForm(): void {

    this.editing = false;

    this.editingProfessionalId = null;

    this.successMessage = '';

    this.errorMessage = '';

    this.resetForm();

    this.showForm = true;

  }


  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  editProfessional(
    professional: Professional
  ): void {

    this.editing = true;

    this.editingProfessionalId =
      professional.professionalId;

    this.successMessage = '';

    this.errorMessage = '';

    this.updateProfessionalData = {

      fullName:
        professional.fullName,

      phone:
        professional.phone,

      specialization:
        professional.specialization,

      isAvailable:
        professional.isAvailable

    };

    this.showForm = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  // ==========================================
  // CLOSE FORM
  // ==========================================

  closeForm(): void {

    this.showForm = false;

    this.editing = false;

    this.editingProfessionalId = null;

    this.submitting = false;

    this.resetForm();

  }


  // ==========================================
  // RESET CREATE FORM
  // ==========================================

  resetForm(): void {

    this.newProfessional = {

      fullName: '',

      email: '',

      phone: '',

      password: '',

      specialization: 'Plumbing',

      isAvailable: true

    };

    this.updateProfessionalData = {

      fullName: '',

      phone: '',

      specialization: 'Plumbing',

      isAvailable: true

    };

  }


  // ==========================================
  // CREATE PROFESSIONAL
  // ==========================================

  createProfessional(
    form: NgForm
  ): void {

    if (form.invalid) {

      form.control.markAllAsTouched();

      return;

    }

    this.submitting = true;

    this.successMessage = '';

    this.errorMessage = '';


    this.professionalService
      .createProfessional(
        this.newProfessional
      )
      .subscribe({

        next: (response) => {

          console.log(
            'PROFESSIONAL CREATED:',
            response
          );

          this.submitting = false;

          this.successMessage =
            'Professional created successfully.';

          this.showForm = false;

          this.resetForm();

          this.loadProfessionals();

        },

        error: (error) => {

          console.error(
            'CREATE PROFESSIONAL ERROR:',
            error
          );

          this.submitting = false;

          if (error.status === 400) {

            this.errorMessage =
              error.error?.message ||
              'This email already exists.';

          }
          else if (error.status === 401) {

            this.errorMessage =
              'Please login as Admin.';

          }
          else if (error.status === 403) {

            this.errorMessage =
              'Only Admin can create professionals.';

          }
          else {

            this.errorMessage =
              'Unable to create professional.';

          }

        }

      });

  }


  // ==========================================
  // UPDATE PROFESSIONAL
  // ==========================================

  updateProfessional(form: NgForm): void {

  if (
    form.invalid ||
    this.editingProfessionalId === null
  ) {

    form.control.markAllAsTouched();

    return;
  }

  this.submitting = true;

  this.successMessage = '';
  this.errorMessage = '';

  const professionalId =
    this.editingProfessionalId;

  console.log(
    'UPDATING PROFESSIONAL:',
    professionalId
  );

  console.log(
    'UPDATE DATA:',
    this.updateProfessionalData
  );

  this.professionalService
    .updateProfessional(
      professionalId,
      this.updateProfessionalData
    )
    .subscribe({

      next: (response) => {

        console.log(
          'PROFESSIONAL UPDATED:',
          response
        );

        this.submitting = false;

        this.successMessage =
          'Professional updated successfully.';

        this.showForm = false;

        this.editing = false;

        this.editingProfessionalId = null;

        this.resetForm();

        this.loadProfessionals();

      },

      error: (error) => {

        console.error(
          'UPDATE PROFESSIONAL ERROR:',
          error
        );

        console.error(
          'STATUS:',
          error.status
        );

        console.error(
          'ERROR BODY:',
          error.error
        );

        this.submitting = false;


        if (error.status === 400) {

          this.errorMessage =
            error.error?.message ||
            'Invalid professional data.';

        }

        else if (error.status === 401) {

          this.errorMessage =
            'Please login as Admin.';

        }

        else if (error.status === 403) {

          this.errorMessage =
            'Only Admin can update professionals.';

        }

        else if (error.status === 404) {

          this.errorMessage =
            'Professional not found.';

        }

        else if (error.status === 500) {

          this.errorMessage =
            error.error?.message ||
            'Server error while updating professional.';

        }

        else {

          this.errorMessage =
            error.error?.message ||
            'Unable to update professional.';

        }

      }

    });

}

}