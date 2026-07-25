using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Infrastructure.Shared.Persistence;
using Nexus.Erp.Modules.Inventory.Domain.Products;
using Nexus.Erp.Modules.Inventory.Domain.StockIssues;
using Nexus.Erp.Modules.Inventory.Domain.StockReceipts;

namespace Nexus.Erp.Modules.Inventory.Infrastructure.Persistence;

public sealed class InventoryDbContext(DbContextOptions<InventoryDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    public DbSet<StockReceipt> StockReceipts => Set<StockReceipt>();

    public DbSet<StockIssue> StockIssues => Set<StockIssue>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(builder =>
        {
            builder.ToTable("products");
            builder.HasKey(product => product.Id);
            builder.Property(product => product.Sku).HasMaxLength(64).IsRequired();
            builder.Property(product => product.Name).HasMaxLength(200).IsRequired();
            builder.Property(product => product.UnitOfMeasure).HasMaxLength(32).IsRequired();
            builder.Property(product => product.UnitPrice).HasColumnType("decimal(18,2)");
            builder.Property(product => product.QuantityOnHand).IsRequired();
            builder.Property(product => product.ReorderLevel).IsRequired();
            builder.Property(product => product.ManufacturingDate).HasColumnType("date");
            builder.Property(product => product.ExpirationDate).HasColumnType("date");
            builder.HasIndex(product => product.Sku).IsUnique();
        });

        modelBuilder.Entity<StockReceipt>(builder =>
        {
            builder.ToTable("stock_receipts");
            builder.HasKey(receipt => receipt.Id);
            builder.Property(receipt => receipt.ReceiptNumber).HasMaxLength(64).IsRequired();
            builder.Property(receipt => receipt.SupplierName).HasMaxLength(200).IsRequired();
            builder.Property(receipt => receipt.ReceivedAtUtc).IsRequired();
            builder.Property(receipt => receipt.Note).HasMaxLength(500);
            builder.HasIndex(receipt => receipt.ReceiptNumber).IsUnique();
            builder.HasMany(receipt => receipt.Lines)
                .WithOne()
                .HasForeignKey(line => line.StockReceiptId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Navigation(receipt => receipt.Lines).UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        modelBuilder.Entity<StockReceiptLine>(builder =>
        {
            builder.ToTable("stock_receipt_lines");
            builder.HasKey(line => line.Id);
            builder.Property(line => line.Sku).HasMaxLength(64).IsRequired();
            builder.Property(line => line.Quantity).IsRequired();
            builder.Property(line => line.UnitCost).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<StockIssue>(builder =>
        {
            builder.ToTable("stock_issues");
            builder.HasKey(issue => issue.Id);
            builder.Property(issue => issue.IssueNumber).HasMaxLength(64).IsRequired();
            builder.Property(issue => issue.RequestedBy).HasMaxLength(200).IsRequired();
            builder.Property(issue => issue.IssuedAtUtc).IsRequired();
            builder.Property(issue => issue.Note).HasMaxLength(500);
            builder.HasIndex(issue => issue.IssueNumber).IsUnique();
            builder.HasMany(issue => issue.Lines)
                .WithOne()
                .HasForeignKey(line => line.StockIssueId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Navigation(issue => issue.Lines).UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        modelBuilder.Entity<StockIssueLine>(builder =>
        {
            builder.ToTable("stock_issue_lines");
            builder.HasKey(line => line.Id);
            builder.Property(line => line.Sku).HasMaxLength(64).IsRequired();
            builder.Property(line => line.Quantity).IsRequired();
            builder.Property(line => line.Reason).HasMaxLength(300);
        });
    }
}

