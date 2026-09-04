using System.ComponentModel.DataAnnotations;

namespace Serviqo.API.DTOs;

public class ServiceDto
{
    [Required]
    public string ServiceName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Range(1, 100000)]
    public decimal Price { get; set; }
}