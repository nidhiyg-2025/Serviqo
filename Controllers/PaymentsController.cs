using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using Serviqo.API.Data;
using System.Security.Claims;

namespace Serviqo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public PaymentsController(
        ApplicationDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // ============================================
    // CREATE RAZORPAY ORDER
    // ============================================

    [Authorize(Roles = "Customer")]
    [HttpPost("create-order/{bookingId}")]
    public async Task<IActionResult> CreateOrder(int bookingId)
    {
        var customerIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(customerIdClaim, out int customerId))
        {
            return Unauthorized(new
            {
                message = "Invalid customer."
            });
        }

        var booking = await _context.Bookings
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b =>
                b.BookingId == bookingId &&
                b.CustomerId == customerId);

        if (booking == null)
        {
            return NotFound(new
            {
                message = "Booking not found."
            });
        }

        if (booking.PaymentStatus == "Paid")
        {
            return BadRequest(new
            {
                message = "Payment has already been completed."
            });
        }

        if (booking.Service == null)
        {
            return BadRequest(new
            {
                message = "Service information not found."
            });
        }

        // Get service price from database
        decimal amount = booking.Service.Price;

        if (amount <= 0)
        {
            return BadRequest(new
            {
                message = "Invalid service amount."
            });
        }

        var keyId = _configuration["Razorpay:KeyId"];
        var keySecret = _configuration["Razorpay:KeySecret"];

        if (string.IsNullOrEmpty(keyId) ||
            string.IsNullOrEmpty(keySecret))
        {
            return StatusCode(500, new
            {
                message = "Razorpay configuration is missing."
            });
        }

        RazorpayClient client = new RazorpayClient(
            keyId,
            keySecret
        );

        var options = new Dictionary<string, object>
        {
            { "amount", (int)(amount * 100) },
            { "currency", "INR" },
            { "receipt", booking.BookingNumber },
            { "payment_capture", 1 }
        };

        Order order = client.Order.Create(options);

        string orderId = order["id"].ToString()!;

        booking.Amount = amount;
        booking.RazorpayOrderId = orderId;
        booking.PaymentStatus = "Pending";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            orderId = orderId,
            amount = (int)(amount * 100),
            currency = "INR",
            keyId = keyId,
            bookingId = booking.BookingId,
            bookingNumber = booking.BookingNumber
        });
    }


    // ============================================
    // VERIFY PAYMENT
    // ============================================

    [Authorize(Roles = "Customer")]
    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment(
        [FromBody] VerifyPaymentRequest request)
    {
        var customerIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(customerIdClaim, out int customerId))
        {
            return Unauthorized(new
            {
                message = "Invalid customer."
            });
        }

        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b =>
                b.BookingId == request.BookingId &&
                b.CustomerId == customerId);

        if (booking == null)
        {
            return NotFound(new
            {
                message = "Booking not found."
            });
        }

        if (booking.RazorpayOrderId != request.RazorpayOrderId)
        {
            return BadRequest(new
            {
                message = "Invalid Razorpay order."
            });
        }

        var keySecret = _configuration["Razorpay:KeySecret"];

        if (string.IsNullOrEmpty(keySecret))
        {
            return StatusCode(500, new
            {
                message = "Razorpay configuration is missing."
            });
        }

        try
        {
            var attributes = new Dictionary<string, string>
            {
                {
                    "razorpay_order_id",
                    request.RazorpayOrderId
                },
                {
                    "razorpay_payment_id",
                    request.RazorpayPaymentId
                },
                {
                    "razorpay_signature",
                    request.RazorpaySignature
                }
            };

            Utils.verifyPaymentSignature(attributes);

            booking.RazorpayPaymentId =
                request.RazorpayPaymentId;

            booking.PaymentStatus = "Paid";
            booking.PaidAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Payment successful."
            });
        }
        catch
        {
            booking.PaymentStatus = "Failed";

            await _context.SaveChangesAsync();

            return BadRequest(new
            {
                success = false,
                message = "Payment verification failed."
            });
        }
    }
}


// ============================================
// VERIFY PAYMENT REQUEST
// ============================================

public class VerifyPaymentRequest
{
    public int BookingId { get; set; }

    public string RazorpayOrderId { get; set; } = string.Empty;

    public string RazorpayPaymentId { get; set; } = string.Empty;

    public string RazorpaySignature { get; set; } = string.Empty;
}