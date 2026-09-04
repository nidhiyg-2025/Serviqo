using System.ComponentModel.DataAnnotations;

namespace Serviqo.API.DTOs;

public class AssignProfessionalDto
{
    [Required]
    public int ProfessionalId { get; set; }
}