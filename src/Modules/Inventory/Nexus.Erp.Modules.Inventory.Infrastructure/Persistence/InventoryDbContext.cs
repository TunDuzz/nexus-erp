using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Infrastructure.Shared.Persistence;
using Nexus.Erp.Modules.Inventory.Domain.Products;

namespace Nexus.Erp.Modules.Inventory.Infrastructure.Persistence;

public sealed class InventoryDbContext(DbContextOptions<InventoryDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(builder =>
        {
            builder.ToTable("products");
            builder.HasKey(product => product.Id);
            builder.Property(product => product.Sku).HasMaxLength(64).IsRequired();
            builder.Property(product => product.Name).HasMaxLength(200).IsRequired();
            builder.Property(product => product.UnitPrice).HasColumnType("decimal(18,2)");
            builder.Property(product => product.QuantityOnHand).IsRequired();
            builder.Property(product => product.ReorderLevel).IsRequired();
            builder.HasIndex(product => product.Sku).IsUnique();
        });
    }
}
