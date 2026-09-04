using Microsoft.EntityFrameworkCore;
using Serviqo.API.Models;

namespace Serviqo.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Service> Services => Set<Service>();

    public DbSet<Professional> Professionals => Set<Professional>();

    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Booking>()
            .HasIndex(b => b.BookingNumber)
            .IsUnique();

        // User → Customer bookings
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Customer)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // User → Professional
        modelBuilder.Entity<Professional>()
            .HasOne(p => p.User)
            .WithOne(u => u.Professional)
            .HasForeignKey<Professional>(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Professional → Bookings
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Professional)
            .WithMany(p => p.Bookings)
            .HasForeignKey(b => b.ProfessionalId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Service>()
            .Property(s => s.Price)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Service>().HasData(
            new Service
            {
                ServiceId = 1,
                ServiceName = "Plumbing",
                Description = "Professional plumbing repair and installation services.",
                Price = 499,
                IsActive = true
            },
            new Service
            {
                ServiceId = 2,
                ServiceName = "Electrical",
                Description = "Safe and reliable electrical repair services.",
                Price = 399,
                IsActive = true
            },
            new Service
            {
                ServiceId = 3,
                ServiceName = "AC Repair",
                Description = "AC servicing, repair and maintenance.",
                Price = 599,
                IsActive = true
            },
            new Service
            {
                ServiceId = 4,
                ServiceName = "Home Cleaning",
                Description = "Professional home cleaning services.",
                Price = 799,
                IsActive = true
            },
            new Service
            {
                ServiceId = 5,
                ServiceName = "Carpentry",
                Description = "Furniture repair and carpentry services.",
                Price = 499,
                IsActive = true
            },
            new Service
            {
                ServiceId = 6,
                ServiceName = "Appliance Repair",
                Description = "Repair services for household appliances.",
                Price = 549,
                IsActive = true
            }
        );
    }
}