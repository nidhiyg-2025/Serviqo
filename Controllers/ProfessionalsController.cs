using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Serviqo.API.Data;
using Serviqo.API.DTOs;
using Serviqo.API.Models;

namespace Serviqo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ProfessionalsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProfessionalsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ==========================================
    // ADMIN: GET ALL PROFESSIONALS
    // ==========================================

    [HttpGet]
    public async Task<IActionResult> GetProfessionals()
    {
        var professionals = await _context.Professionals
            .OrderBy(p => p.FullName)
            .ToListAsync();

        return Ok(professionals);
    }


    // ==========================================
    // ADMIN: GET PROFESSIONAL BY ID
    // ==========================================

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfessional(int id)
    {
        var professional = await _context.Professionals
            .FindAsync(id);

        if (professional == null)
        {
            return NotFound(new
            {
                message = "Professional not found."
            });
        }

        return Ok(professional);
    }


    // ==========================================
    // ADMIN: CREATE PROFESSIONAL
    // Creates User + Professional profile
    // ==========================================

    [HttpPost]
    public async Task<IActionResult> CreateProfessional(
        CreateProfessionalDto dto)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (existingUser != null)
        {
            return BadRequest(new
            {
                message =
                    "An account with this email already exists."
            });
        }

        // Create login account
        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Professional"
        };

        _context.Users.Add(user);

        // Save first to generate UserId
        await _context.SaveChangesAsync();

        // Create professional profile
        var professional = new Professional
        {
            UserId = user.UserId,
            FullName = dto.FullName,
            Phone = dto.Phone,
            Specialization = dto.Specialization,
            IsAvailable = dto.IsAvailable
        };

        _context.Professionals.Add(professional);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Professional created successfully.",

            userId = user.UserId,

            professionalId =
                professional.ProfessionalId
        });
    }


    // ==========================================
    // ADMIN: UPDATE PROFESSIONAL
    // ==========================================

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProfessional(
        int id,
        ProfessionalDto dto)
    {
        var professional =
            await _context.Professionals
                .FirstOrDefaultAsync(
                    p => p.ProfessionalId == id
                );

        if (professional == null)
        {
            return NotFound(new
            {
                message = "Professional not found."
            });
        }


        // Update professional profile

        professional.FullName =
            dto.FullName;

        professional.Phone =
            dto.Phone;

        professional.Specialization =
            dto.Specialization;

        professional.IsAvailable =
            dto.IsAvailable;


        // Update linked User account

        if (professional.UserId > 0)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(
                        u => u.UserId == professional.UserId
                    );

            if (user != null)
            {
                user.FullName =
                    dto.FullName;

                user.Phone =
                    dto.Phone;
            }
        }


        await _context.SaveChangesAsync();


        return Ok(new
        {
            message =
                "Professional updated successfully.",

            professionalId =
                professional.ProfessionalId,

            userId =
                professional.UserId,

            fullName =
                professional.FullName,

            phone =
                professional.Phone,

            specialization =
                professional.Specialization,

            isAvailable =
                professional.IsAvailable
        });
    }


    // ==========================================
    // ADMIN: UPDATE AVAILABILITY
    // ==========================================

    [HttpPatch("{id}/availability")]
    public async Task<IActionResult> UpdateAvailability(
        int id,
        bool available)
    {
        var professional =
            await _context.Professionals
                .FindAsync(id);

        if (professional == null)
        {
            return NotFound(new
            {
                message =
                    "Professional not found."
            });
        }


        professional.IsAvailable =
            available;


        await _context.SaveChangesAsync();


        return Ok(new
        {
            message =
                "Availability updated successfully.",

            available =
                professional.IsAvailable
        });
    }
}