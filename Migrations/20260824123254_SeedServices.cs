using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Serviqo.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Services",
                columns: new[] { "ServiceId", "Description", "IsActive", "Price", "ServiceName" },
                values: new object[,]
                {
                    { 1, "Professional plumbing repair and installation services.", true, 499m, "Plumbing" },
                    { 2, "Safe and reliable electrical repair services.", true, 399m, "Electrical" },
                    { 3, "AC servicing, repair and maintenance.", true, 599m, "AC Repair" },
                    { 4, "Professional home cleaning services.", true, 799m, "Home Cleaning" },
                    { 5, "Furniture repair and carpentry services.", true, 499m, "Carpentry" },
                    { 6, "Repair services for household appliances.", true, 549m, "Appliance Repair" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "ServiceId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "ServiceId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "ServiceId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "ServiceId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "ServiceId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "ServiceId",
                keyValue: 6);
        }
    }
}
