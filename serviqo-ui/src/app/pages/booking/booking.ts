import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ServiceService } from '../../core/services/service';

declare var Razorpay: any;

@Component({
  selector: 'app-booking',

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './booking.html',
  styleUrl: './booking.css'
})
export class Booking implements OnInit {

  private serviceService = inject(ServiceService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);


  // ==========================================
  // SELECTED SERVICE
  // ==========================================

  serviceId = 0;
  serviceName = '';
  servicePrice = 0;


  // ==========================================
  // BOOKING FORM
  // ==========================================

  bookingDate = '';
  address = '';
  phone = '';
  description = '';


  // ==========================================
  // PAYMENT / BOOKING
  // ==========================================

  bookingId = 0;
  bookingNumber = '';


  // ==========================================
  // UI STATE
  // ==========================================

  loadingService = true;
  loading = false;
  paymentLoading = false;

  errorMessage = '';
  successMessage = '';


  // ==========================================
  // PREVENT DUPLICATE BOOKING
  // ==========================================

  bookingSubmitted = false;


  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {

      const id = Number(params['serviceId']);

      if (!id) {

        this.errorMessage =
          'Please select a service first.';

        this.loadingService = false;

        return;
      }

      this.serviceId = id;

      this.loadService(id);
    });
  }


  // ==========================================
  // LOAD SERVICE
  // ==========================================

  loadService(id: number): void {

    this.serviceService.getService(id).subscribe({

      next: (service) => {

        this.serviceName =
          service.serviceName;

        this.servicePrice =
          service.price;

        this.loadingService = false;
      },

      error: (error) => {

        console.error(
          'SERVICE LOAD ERROR:',
          error
        );

        this.errorMessage =
          'Unable to load the selected service.';

        this.loadingService = false;
      }

    });
  }


  // ==========================================
  // CREATE BOOKING
  // ==========================================

  submitBooking(): void {

    // ------------------------------------------
    // PREVENT DUPLICATE SUBMISSION
    // ------------------------------------------

    if (
      this.bookingSubmitted ||
      this.loading ||
      this.paymentLoading
    ) {

      return;
    }


    this.errorMessage = '';
    this.successMessage = '';


    // ------------------------------------------
    // BASIC VALIDATION
    // ------------------------------------------

    if (
      !this.bookingDate ||
      !this.address.trim() ||
      !this.phone.trim()
    ) {

      this.errorMessage =
        'Please fill in all required fields.';

      return;
    }


    // ------------------------------------------
    // PHONE VALIDATION
    // ------------------------------------------

    if (!/^[0-9]{10}$/.test(this.phone)) {

      this.errorMessage =
        'Please enter a valid 10-digit phone number.';

      return;
    }


    // ------------------------------------------
    // DATE VALIDATION
    // ------------------------------------------

    const selectedDate =
      new Date(this.bookingDate);


    if (
      isNaN(selectedDate.getTime()) ||
      selectedDate <= new Date()
    ) {

      this.errorMessage =
        'Please select a future date and time.';

      return;
    }


    // ==========================================
    // IMPORTANT TIMEZONE FIX
    // ==========================================
    //
    // DO NOT use:
    //
    // selectedDate.toISOString()
    //
    // because it converts IST to UTC.
    //
    // Example:
    //
    // 13:30 IST
    // becomes
    // 08:00 UTC
    //
    // Instead, send the datetime-local value
    // exactly as selected by the customer.
    //
    // Example:
    //
    // 2026-08-30T13:30
    //
    // ==========================================

    const bookingData = {

      serviceId:
        this.serviceId,

      bookingDate:
        this.bookingDate,

      address:
        this.address.trim(),

      phone:
        this.phone.trim(),

      description:
        this.description.trim()
    };


    console.log(
      'BOOKING REQUEST:',
      bookingData
    );


    // ------------------------------------------
    // LOCK SUBMISSION
    // ------------------------------------------

    this.bookingSubmitted = true;

    this.loading = true;


    // ==========================================
    // CREATE BOOKING
    // ==========================================

    this.http
      .post<any>(
        '/api/Bookings',
        bookingData
      )
      .subscribe({

        next: (response) => {

          console.log(
            'BOOKING SUCCESS:',
            response
          );


          this.loading = false;


          // --------------------------------------
          // GET BOOKING ID
          // --------------------------------------

          this.bookingId =
            response.bookingId ??
            response.BookingId;


          // --------------------------------------
          // GET BOOKING NUMBER
          // --------------------------------------

          this.bookingNumber =
            response.bookingNumber ??
            response.BookingNumber ??
            '';


          // --------------------------------------
          // CHECK BOOKING ID
          // --------------------------------------

          if (!this.bookingId) {

            this.errorMessage =
              'Booking was created but booking ID was not returned.';

            return;
          }


          // --------------------------------------
          // CREATE RAZORPAY ORDER
          // --------------------------------------

          this.createPaymentOrder();
        },


        error: (error) => {

          console.error(
            'BOOKING ERROR:',
            error
          );


          this.loading = false;


          // --------------------------------------
          // ALLOW RETRY IF BOOKING WAS NOT CREATED
          // --------------------------------------

          this.bookingSubmitted = false;


          if (error.status === 401) {

            this.errorMessage =
              'Please login before booking a service.';
          }

          else if (error.status === 400) {

            this.errorMessage =
              error.error?.message ??
              'Please check the booking details.';
          }

          else if (error.status === 404) {

            this.errorMessage =
              'The booking service could not be found.';
          }

          else {

            this.errorMessage =
              'Unable to create booking. Please try again.';
          }
        }

      });
  }


  // ==========================================
  // CREATE RAZORPAY ORDER
  // ==========================================

  createPaymentOrder(): void {

    this.paymentLoading = true;

    this.errorMessage = '';
    this.successMessage = '';


    this.http
      .post<any>(
        `/api/Payments/create-order/${this.bookingId}`,
        {}
      )
      .subscribe({

        next: (response) => {

          console.log(
            'RAZORPAY ORDER:',
            response
          );


          this.paymentLoading = false;


          // --------------------------------------
          // OPEN RAZORPAY
          // --------------------------------------

          this.openRazorpayCheckout(response);
        },


        error: (error) => {

          console.error(
            'PAYMENT ORDER ERROR:',
            error
          );


          this.paymentLoading = false;


          if (error.status === 401) {

            this.errorMessage =
              'Please login before making payment.';
          }

          else {

            this.errorMessage =
              error.error?.message ??
              'Unable to start payment. Please try again.';
          }

          // Do NOT reset bookingSubmitted.
          //
          // The booking already exists.
        }

      });
  }


  // ==========================================
  // OPEN RAZORPAY CHECKOUT
  // ==========================================

  openRazorpayCheckout(order: any): void {

    if (typeof Razorpay === 'undefined') {

      this.errorMessage =
        'Razorpay Checkout could not be loaded.';

      return;
    }


    // ==========================================
    // RAZORPAY OPTIONS
    // ==========================================

    const options = {

      key:
        order.keyId,

      amount:
        order.amount,

      currency:
        order.currency,

      name:
        'Serviqo',

      description:
        `${this.serviceName} Booking`,

      order_id:
        order.orderId,


      // ========================================
      // PAYMENT SUCCESS
      // ========================================

      handler: (paymentResponse: any) => {

        console.log(
          'RAZORPAY PAYMENT RESPONSE:',
          paymentResponse
        );


        this.verifyPayment(
          paymentResponse
        );
      },


      // ========================================
      // CUSTOMER DETAILS
      // ========================================

      prefill: {

        contact:
          this.phone
      },


      // ========================================
      // THEME
      // ========================================

      theme: {

        color:
          '#171717'
      },


      // ========================================
      // MODAL CLOSE
      // ========================================

      modal: {

        ondismiss: () => {

          this.errorMessage =
            'Payment was cancelled. Your booking is still pending payment.';
        }

      }

    };


    // ==========================================
    // CREATE RAZORPAY INSTANCE
    // ==========================================

    const razorpay =
      new Razorpay(options);


    // ==========================================
    // PAYMENT FAILED
    // ==========================================

    razorpay.on(
      'payment.failed',
      (response: any) => {

        console.error(
          'PAYMENT FAILED:',
          response
        );


        this.errorMessage =
          'Payment failed. Please try again.';
      }
    );


    // ==========================================
    // OPEN CHECKOUT
    // ==========================================

    razorpay.open();
  }


  // ==========================================
  // VERIFY PAYMENT
  // ==========================================

  verifyPayment(
    paymentResponse: any
  ): void {

    this.paymentLoading = true;

    this.errorMessage = '';


    // ==========================================
    // VERIFICATION DATA
    // ==========================================

    const verifyData = {

      bookingId:
        this.bookingId,

      razorpayOrderId:
        paymentResponse.razorpay_order_id,

      razorpayPaymentId:
        paymentResponse.razorpay_payment_id,

      razorpaySignature:
        paymentResponse.razorpay_signature
    };


    console.log(
      'VERIFY PAYMENT REQUEST:',
      verifyData
    );


    // ==========================================
    // VERIFY WITH BACKEND
    // ==========================================

    this.http
      .post<any>(
        '/api/Payments/verify',
        verifyData
      )
      .subscribe({

        next: (response) => {

          console.log(
            'PAYMENT VERIFIED:',
            response
          );


          this.paymentLoading = false;


          this.successMessage =
            `Payment successful! Booking ${this.bookingNumber} has been confirmed.`;


          // ======================================
          // REDIRECT
          // ======================================

          setTimeout(() => {

            this.router.navigate(
              ['/my-bookings']
            );

          }, 2000);
        },


        error: (error) => {

          console.error(
            'PAYMENT VERIFICATION ERROR:',
            error
          );


          this.paymentLoading = false;


          this.errorMessage =
            error.error?.message ??
            'Payment verification failed. Please contact Serviqo support.';
        }

      });
  }

}