namespace Serviqo.API.DTOs;

public class CreateProfessionalDto
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Specialization { get; set; } = string.Empty;

    public bool IsAvailable { get; set; } = true;
}