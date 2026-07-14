using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexus.Erp.Modules.Inventory.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductStockFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "QuantityOnHand",
                table: "products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReorderLevel",
                table: "products",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QuantityOnHand",
                table: "products");

            migrationBuilder.DropColumn(
                name: "ReorderLevel",
                table: "products");
        }
    }
}
