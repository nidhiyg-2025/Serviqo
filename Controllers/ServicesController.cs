using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Serviqo.API.Data;
using Serviqo.API.DTOs;
using Serviqo.API.Models;

namespace Serviqo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ServicesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Anyone can view active services
    [HttpGet]
    public async Task<IActionResult> GetServices()
    {
        var services = await _context.Services
            .Where(s => s.IsActive)
            .OrderBy(s => s.ServiceName)
            .ToListAsync();

        return Ok(services);
    }

    // Admin only
    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllServices()
    {
        var services = await _context.Services
            .OrderBy(s => s.ServiceName)
            .ToListAsync();

        return Ok(services);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetService(int id)
    {
        var service = await _context.Services
            .FirstOrDefaultAsync(s =>
                s.ServiceId == id &&
                s.IsActive);

        if (service == null)
        {
            return NotFound(new
            {
                message = "Service not found."
            });
        }

        return Ok(service);
    }

    // Admin only
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateService(ServiceDto dto)
    {
        var service = new Service
        {
            ServiceName = dto.ServiceName,
            Description = dto.Description,
            Price = dto.Price,
            IsActive = true
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        return Ok(service);
    }

    // Admin only
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateService(
        int id,
        ServiceDto dto)
    {
        var service = await _context.Services.FindAsync(id);

        if (service == null)
        {
            return NotFound(new
            {
                message = "Service not found."
            });
        }

        service.ServiceName = dto.ServiceName;
        service.Description = dto.Description;
        service.Price = dto.Price;

        await _context.SaveChangesAsync();

        return Ok(service);
    }

    // Admin only - soft delete
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/deactivate")]
    public async Task<IActionResult> DeactivateService(int id)
    {
        var service = await _context.Services.FindAsync(id);

        if (service == null)
        {
            return NotFound(new
            {
                message = "Service not found."
            });
        }

        service.IsActive = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Service deactivated successfully."
        });
    }
}