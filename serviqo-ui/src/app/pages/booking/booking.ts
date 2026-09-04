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
  // API
  // ==========================================

  private apiUrl =
    'https://serviqo-rqee.onrender.com/api';


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

        console.log(
          'SELECTED SERVICE:',
          service
        );

        if (!service) {

          this.errorMessage =
            'Selected service could not be found.';

          this.loadingService = false;

          return;
        }

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

    if (!/^[0-9]{10}$/.test(this.phone.trim())) {

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
    // BOOKING DATA
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
        `${this.apiUrl}/Bookings`,
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
          // SAFETY CHECK
          // --------------------------------------

          if (!response) {

            console.error(
              'BOOKING RESPONSE IS NULL'
            );

            this.errorMessage =
              'Booking was created but the server returned an empty response.';

            this.bookingSubmitted = false;

            return;
          }


          // --------------------------------------
          // GET BOOKING ID
          // --------------------------------------

          this.bookingId =
            response.bookingId ??
            response.BookingId ??
            0;


          // --------------------------------------
          // GET BOOKING NUMBER
          // --------------------------------------

          this.bookingNumber =
            response.bookingNumber ??
            response.BookingNumber ??
            '';


          console.log(
            'BOOKING ID:',
            this.bookingId
          );

          console.log(
            'BOOKING NUMBER:',
            this.bookingNumber
          );


          // --------------------------------------
          // CHECK BOOKING ID
          // --------------------------------------

          if (!this.bookingId) {

            console.error(
              'BOOKING ID WAS NOT RETURNED:',
              response
            );

            this.errorMessage =
              'Booking was created but booking ID was not returned.';

            this.bookingSubmitted = false;

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
          // ALLOW RETRY
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

    // ------------------------------------------
    // SAFETY CHECK
    // ------------------------------------------

    if (!this.bookingId) {

      console.error(
        'Cannot create payment order. Booking ID is missing.'
      );

      this.errorMessage =
        'Booking ID is missing. Payment cannot be started.';

      return;
    }


    this.paymentLoading = true;

    this.errorMessage = '';
    this.successMessage = '';


    // ==========================================
    // CREATE PAYMENT ORDER
    // ==========================================

    this.http
      .post<any>(
        `${this.apiUrl}/Payments/create-order/${this.bookingId}`,
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
          // CHECK PAYMENT RESPONSE
          // --------------------------------------

          if (!response) {

            console.error(
              'RAZORPAY ORDER RESPONSE IS NULL'
            );

            this.errorMessage =
              'Unable to create payment order.';

            return;
          }


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

          // Booking already exists.
        }

      });
  }


  // ==========================================
  // OPEN RAZORPAY CHECKOUT
  // ==========================================

  openRazorpayCheckout(order: any): void {

    // ------------------------------------------
    // CHECK RAZORPAY
    // ------------------------------------------

    if (typeof Razorpay === 'undefined') {

      this.errorMessage =
        'Razorpay Checkout could not be loaded.';

      return;
    }


    // ------------------------------------------
    // CHECK ORDER
    // ------------------------------------------

    if (
      !order ||
      !order.orderId ||
      !order.keyId
    ) {

      console.error(
        'INVALID RAZORPAY ORDER:',
        order
      );

      this.errorMessage =
        'Invalid payment order received from server.';

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

    // ------------------------------------------
    // SAFETY CHECK
    // ------------------------------------------

    if (!this.bookingId) {

      console.error(
        'Cannot verify payment. Booking ID is missing.'
      );

      this.errorMessage =
        'Booking ID is missing. Payment verification cannot continue.';

      return;
    }


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
        `${this.apiUrl}/Payments/verify`,
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