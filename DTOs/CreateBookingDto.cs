using System.ComponentModel.DataAnnotations;

namespace Serviqo.API.DTOs;

public class CreateBookingDto
{
    [Required]
    public int ServiceId { get; set; }

    [Required]
    public DateTime BookingDate { get; set; }

    [Required]
    public string Address { get; set; } = string.Empty;

    [Required]
    public string Phone { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}