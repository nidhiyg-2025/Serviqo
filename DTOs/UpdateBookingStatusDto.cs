using System.ComponentModel.DataAnnotations;

namespace Serviqo.API.DTOs;

public class UpdateBookingStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}