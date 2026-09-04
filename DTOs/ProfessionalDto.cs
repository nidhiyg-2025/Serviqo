using System.ComponentModel.DataAnnotations;

namespace Serviqo.API.DTOs;

public class ProfessionalDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string Phone { get; set; } = string.Empty;

    [Required]
    public string Specialization { get; set; } = string.Empty;

    public bool IsAvailable { get; set; } = true;
}