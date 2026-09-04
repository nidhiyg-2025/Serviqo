using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Serviqo.API.Migrations
{
    public partial class AddProfessionalUserRelationship : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove the old/unused professional relationship
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Professionals_ServiceProviderProfessionalId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_ServiceProviderProfessionalId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ServiceProviderProfessionalId",
                table: "Bookings");


            // Add UserId temporarily as nullable
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Professionals",
                type: "int",
                nullable: true);


            // Connect existing ProfessionalId = 1
            // to existing UserId = 5 (Rahul Sharma)
            migrationBuilder.Sql(
                "UPDATE Professionals SET UserId = 5 WHERE ProfessionalId = 1");


            // Make UserId required after existing data is populated
            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Professionals",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);


            // One User can have only one Professional profile
            migrationBuilder.CreateIndex(
                name: "IX_Professionals_UserId",
                table: "Professionals",
                column: "UserId",
                unique: true);


            // Professional → User relationship
            migrationBuilder.AddForeignKey(
                name: "FK_Professionals_Users_UserId",
                table: "Professionals",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Professionals_Users_UserId",
                table: "Professionals");

            migrationBuilder.DropIndex(
                name: "IX_Professionals_UserId",
                table: "Professionals");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Professionals");

            // Restore old column
            migrationBuilder.AddColumn<int>(
                name: "ServiceProviderProfessionalId",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ServiceProviderProfessionalId",
                table: "Bookings",
                column: "ServiceProviderProfessionalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Professionals_ServiceProviderProfessionalId",
                table: "Bookings",
                column: "ServiceProviderProfessionalId",
                principalTable: "Professionals",
                principalColumn: "ProfessionalId");
        }
    }
}