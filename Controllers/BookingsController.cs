using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Serviqo.API.Data;
using Serviqo.API.DTOs;
using Serviqo.API.Models;
using System.Security.Claims;

namespace Serviqo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BookingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // CUSTOMER: Create booking
    // =========================================================

    [Authorize(Roles = "Customer")]
    [HttpPost]
    public async Task<IActionResult> CreateBooking(CreateBookingDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var customerId = int.Parse(userIdClaim.Value);

        var service = await _context.Services
            .FirstOrDefaultAsync(s =>
                s.ServiceId == dto.ServiceId &&
                s.IsActive);

        if (service == null)
        {
            return BadRequest(new
            {
                message = "Selected service is not available."
            });
        }

        if (dto.BookingDate <= DateTime.Now)
        {
            return BadRequest(new
            {
                message = "Booking date must be in the future."
            });
        }

        var booking = new Booking
        {
            BookingNumber = GenerateBookingNumber(),

            CustomerId = customerId,

            ServiceId = dto.ServiceId,

            // Initially no professional is assigned
            ProfessionalId = null,

            BookingDate = dto.BookingDate,

            Address = dto.Address,

            Phone = dto.Phone,

            Description = dto.Description,

            Status = "Pending"
        };

        _context.Bookings.Add(booking);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Booking created successfully.",

            bookingId = booking.BookingId,

            bookingNumber = booking.BookingNumber
        });
    }


    // =========================================================
    // CUSTOMER: My bookings
    // =========================================================

    [Authorize(Roles = "Customer")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyBookings()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var customerId = int.Parse(userIdClaim.Value);

        var bookings = await _context.Bookings

            .Where(b => b.CustomerId == customerId)

            .Include(b => b.Service)

            .Include(b => b.Professional)

            .OrderByDescending(b => b.CreatedAt)

            .Select(b => new
            {
                b.BookingId,

                b.BookingNumber,

                Service = b.Service.ServiceName,

                b.BookingDate,

                b.Address,

                b.Status,

                Professional = b.Professional != null
                    ? b.Professional.FullName
                    : null,

                b.CreatedAt
            })

            .ToListAsync();

        return Ok(bookings);
    }


    // =========================================================
    // CUSTOMER: Booking details
    // =========================================================

    [Authorize(Roles = "Customer")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMyBooking(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var customerId = int.Parse(userIdClaim.Value);

        var booking = await _context.Bookings

            .Where(b =>
                b.BookingId == id &&
                b.CustomerId == customerId)

            .Include(b => b.Service)

            .Include(b => b.Professional)

            .Select(b => new
            {
                b.BookingId,

                b.BookingNumber,

                Service = b.Service.ServiceName,

                ServicePrice = b.Service.Price,

                b.BookingDate,

                b.Address,

                b.Phone,

                b.Description,

                b.Status,

                Professional = b.Professional != null
                    ? new
                    {
                        b.Professional.FullName,

                        b.Professional.Phone,

                        b.Professional.Specialization
                    }
                    : null,

                b.CreatedAt
            })

            .FirstOrDefaultAsync();

        if (booking == null)
        {
            return NotFound(new
            {
                message = "Booking not found."
            });
        }

        return Ok(booking);
    }


    // =========================================================
    // ADMIN: View all bookings
    // =========================================================

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllBookings()
    {
        var bookings = await _context.Bookings

            .Include(b => b.Customer)

            .Include(b => b.Service)

            .Include(b => b.Professional)

            .OrderByDescending(b => b.CreatedAt)

            .Select(b => new
            {
                b.BookingId,

                b.BookingNumber,

                Customer = b.Customer.FullName,

                CustomerPhone = b.Customer.Phone,

                Service = b.Service.ServiceName,

                b.BookingDate,

                b.Address,

                b.Phone,

                b.Description,

                b.Status,

                Professional = b.Professional != null
                    ? b.Professional.FullName
                    : null,

                b.CreatedAt
            })

            .ToListAsync();

        return Ok(bookings);
    }


    // =========================================================
    // ADMIN: Assign professional
    // =========================================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/assign")]
    public async Task<IActionResult> AssignProfessional(
        int id,
        AssignProfessionalDto dto)
    {
        var booking = await _context.Bookings
            .FindAsync(id);

        if (booking == null)
        {
            return NotFound(new
            {
                message = "Booking not found."
            });
        }

        var professional = await _context.Professionals

            .FirstOrDefaultAsync(p =>
                p.ProfessionalId == dto.ProfessionalId &&
                p.IsAvailable);

        if (professional == null)
        {
            return BadRequest(new
            {
                message = "Professional is unavailable."
            });
        }

        booking.ProfessionalId =
            professional.ProfessionalId;

        booking.Status = "Assigned";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Professional assigned successfully.",

            professionalId =
                professional.ProfessionalId,

            professionalName =
                professional.FullName
        });
    }


    // =========================================================
    // ADMIN: Update booking status
    // =========================================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateBookingStatusDto dto)
    {
        var allowedStatuses = new[]
        {
            "Pending",
            "Assigned",
            "InProgress",
            "Completed",
            "Cancelled"
        };

        if (!allowedStatuses.Contains(dto.Status))
        {
            return BadRequest(new
            {
                message = "Invalid booking status."
            });
        }

        var booking = await _context.Bookings
            .FindAsync(id);

        if (booking == null)
        {
            return NotFound(new
            {
                message = "Booking not found."
            });
        }

        booking.Status = dto.Status;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Booking status updated successfully.",

            status = booking.Status
        });
    }


    // =========================================================
    // PROFESSIONAL: View assigned bookings
    // =========================================================

    [Authorize(Roles = "Professional")]
    [HttpGet("professional")]
    public async Task<IActionResult> GetProfessionalBookings()
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var userId = int.Parse(userIdClaim.Value);

        // Find Professional profile linked to
        // the logged-in User
        var professional = await _context.Professionals

            .FirstOrDefaultAsync(p =>
                p.UserId == userId);

        if (professional == null)
        {
            return NotFound(new
            {
                message =
                    "Professional profile not found."
            });
        }

        var bookings = await _context.Bookings

            .Where(b =>
                b.ProfessionalId ==
                professional.ProfessionalId)

            .Include(b => b.Customer)

            .Include(b => b.Service)

            .OrderByDescending(b => b.BookingDate)

            .Select(b => new
            {
                b.BookingId,

                b.BookingNumber,

                Customer = b.Customer.FullName,

                CustomerPhone = b.Customer.Phone,

                Service = b.Service.ServiceName,

                b.BookingDate,

                b.Address,

                b.Phone,

                b.Description,

                b.Status,

                b.CreatedAt
            })

            .ToListAsync();

        return Ok(bookings);
    }


    // =========================================================
    // PROFESSIONAL: Update assigned booking status
    // =========================================================

    [Authorize(Roles = "Professional")]
    [HttpPut("{id}/professional-status")]
    public async Task<IActionResult> UpdateProfessionalStatus(
        int id,
        UpdateBookingStatusDto dto)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        var userId = int.Parse(userIdClaim.Value);

        // Find logged-in professional
        var professional = await _context.Professionals

            .FirstOrDefaultAsync(p =>
                p.UserId == userId);

        if (professional == null)
        {
            return NotFound(new
            {
                message =
                    "Professional profile not found."
            });
        }

        // Professional can only move
        // Assigned booking to these statuses
        var allowedStatuses = new[]
        {
            "InProgress",
            "Completed"
        };

        if (!allowedStatuses.Contains(dto.Status))
        {
            return BadRequest(new
            {
                message =
                    "Invalid professional status."
            });
        }

        // Make sure this booking actually belongs
        // to the logged-in professional
        var booking = await _context.Bookings

            .FirstOrDefaultAsync(b =>
                b.BookingId == id &&
                b.ProfessionalId ==
                    professional.ProfessionalId);

        if (booking == null)
        {
            return NotFound(new
            {
                message =
                    "Booking not found or not assigned to you."
            });
        }

        booking.Status = dto.Status;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Booking status updated successfully.",

            status = booking.Status
        });
    }


    // =========================================================
    // Generate unique booking number
    // =========================================================

    private static string GenerateBookingNumber()
    {
        return $"SVQ-{Random.Shared.Next(10000, 99999)}";
    }
}