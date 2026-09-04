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
        // =====================================================
        // IMPORTANT:
        // datetime-local from Angular does NOT contain timezone.
        // We treat the selected date/time as local time.
        // =====================================================

        Console.WriteLine(
            $"BOOKING DATE RECEIVED: {dto.BookingDate:yyyy-MM-dd HH:mm:ss}"
        );

        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized(new
            {
                message = "User authentication information not found."
            });
        }

        if (!int.TryParse(userIdClaim.Value, out int customerId))
        {
            return Unauthorized(new
            {
                message = "Invalid customer information."
            });
        }

        // -----------------------------------------------------
        // Make sure BookingDate is treated as local/unspecified
        // rather than UTC.
        // -----------------------------------------------------

        var bookingDate = DateTime.SpecifyKind(
            dto.BookingDate,
            DateTimeKind.Unspecified
        );

        Console.WriteLine(
            $"BOOKING DATE AFTER NORMALIZATION: {bookingDate:yyyy-MM-dd HH:mm:ss}"
        );

        // =====================================================
        // Check service
        // =====================================================

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

        // =====================================================
        // Check booking date
        // =====================================================

        if (bookingDate <= DateTime.Now)
        {
            return BadRequest(new
            {
                message = "Booking date must be in the future."
            });
        }

        // =====================================================
        // Create booking
        // =====================================================

        var booking = new Booking
        {
            BookingNumber = GenerateBookingNumber(),

            CustomerId = customerId,

            ServiceId = dto.ServiceId,

            // Initially no professional is assigned
            ProfessionalId = null,

            // Store the exact date/time selected by customer
            BookingDate = bookingDate,

            Address = dto.Address,

            Phone = dto.Phone,

            Description = dto.Description,

            Status = "Pending"
        };

        _context.Bookings.Add(booking);

        await _context.SaveChangesAsync();

        Console.WriteLine(
            $"BOOKING SAVED: {booking.BookingDate:yyyy-MM-dd HH:mm:ss}"
        );

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
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        if (!int.TryParse(userIdClaim.Value, out int customerId))
        {
            return Unauthorized();
        }

        var bookings = await _context.Bookings

            .Where(b =>
                b.CustomerId == customerId)

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

                Professional =
                    b.Professional != null
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
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        if (!int.TryParse(userIdClaim.Value, out int customerId))
        {
            return Unauthorized();
        }

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

                Professional =
                    b.Professional != null
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

                Professional =
                    b.Professional != null
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

        var professional =
            await _context.Professionals

            .FirstOrDefaultAsync(p =>
                p.ProfessionalId ==
                    dto.ProfessionalId &&
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
            message =
                "Professional assigned successfully.",

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

        if (!int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized();
        }

        // Find Professional profile linked
        // to the logged-in User
        var professional =
            await _context.Professionals

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

                Customer =
                    b.Customer.FullName,

                CustomerPhone =
                    b.Customer.Phone,

                Service =
                    b.Service.ServiceName,

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
    public async Task<IActionResult>
        UpdateProfessionalStatus(
            int id,
            UpdateBookingStatusDto dto)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return Unauthorized();
        }

        if (!int.TryParse(
                userIdClaim.Value,
                out int userId))
        {
            return Unauthorized();
        }

        // Find logged-in professional
        var professional =
            await _context.Professionals

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
        var booking =
            await _context.Bookings

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