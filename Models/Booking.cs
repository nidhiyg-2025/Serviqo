namespace Serviqo.API.Models;

public class Booking
{
    public int BookingId { get; set; }

    public string BookingNumber { get; set; } = string.Empty;

    public int CustomerId { get; set; }

    public int ServiceId { get; set; }

    public int? ProfessionalId { get; set; }

    public DateTime BookingDate { get; set; }

    public string Address { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "Pending";

    // ============================
    // PAYMENT DETAILS
    // ============================

    public decimal Amount { get; set; }

    public string PaymentStatus { get; set; } = "Pending";

    public string? RazorpayOrderId { get; set; }

    public string? RazorpayPaymentId { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Customer { get; set; } = null!;

    public Service Service { get; set; } = null!;

    public Professional? Professional { get; set; }
}