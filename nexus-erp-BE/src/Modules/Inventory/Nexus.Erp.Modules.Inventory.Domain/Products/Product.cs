using Nexus.Erp.SharedKernel.Domain;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Domain.Products;

public sealed class Product : Entity<Guid>
{
    private Product()
    {
    }

    public Product(
        Guid id,
        string sku,
        string name,
        string unitOfMeasure,
        decimal unitPrice,
        int initialQuantity,
        int reorderLevel,
        DateOnly? manufacturingDate,
        DateOnly? expirationDate)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(sku))
        {
            throw new DomainException(new Error("Inventory.ProductSkuRequired", "Product SKU is required."));
        }

        if (initialQuantity < 0)
        {
            throw new DomainException(new Error("Inventory.ProductQuantityInvalid", "Initial quantity cannot be negative."));
        }

        Sku = sku.Trim();
        QuantityOnHand = initialQuantity;
        UpdateDetails(name, unitOfMeasure, unitPrice, reorderLevel, manufacturingDate, expirationDate);
    }

    public string Sku { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public string UnitOfMeasure { get; private set; } = string.Empty;

    public decimal UnitPrice { get; private set; }

    public int QuantityOnHand { get; private set; }

    public int ReorderLevel { get; private set; }

    public DateOnly? ManufacturingDate { get; private set; }

    public DateOnly? ExpirationDate { get; private set; }

    public bool IsBelowReorderLevel => QuantityOnHand <= ReorderLevel;

    public bool IsExpired(DateOnly today) => ExpirationDate is not null && ExpirationDate.Value < today;

    public bool IsExpiringSoon(DateOnly today, int warningDays = 14) =>
        ExpirationDate is not null &&
        ExpirationDate.Value >= today &&
        ExpirationDate.Value <= today.AddDays(warningDays);

    public void UpdateDetails(
        string name,
        string unitOfMeasure,
        decimal unitPrice,
        int reorderLevel,
        DateOnly? manufacturingDate,
        DateOnly? expirationDate)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException(new Error("Inventory.ProductNameRequired", "Product name is required."));
        }

        if (string.IsNullOrWhiteSpace(unitOfMeasure))
        {
            throw new DomainException(new Error("Inventory.ProductUnitRequired", "Product unit of measure is required."));
        }

        if (unitPrice < 0)
        {
            throw new DomainException(new Error("Inventory.ProductPriceInvalid", "Unit price cannot be negative."));
        }

        if (reorderLevel < 0)
        {
            throw new DomainException(new Error("Inventory.ProductReorderLevelInvalid", "Reorder level cannot be negative."));
        }

        if (manufacturingDate is not null && expirationDate is not null && expirationDate < manufacturingDate)
        {
            throw new DomainException(new Error("Inventory.ProductExpirationDateInvalid", "Expiration date cannot be before manufacturing date."));
        }

        Name = name.Trim();
        UnitOfMeasure = unitOfMeasure.Trim();
        UnitPrice = unitPrice;
        ReorderLevel = reorderLevel;
        ManufacturingDate = manufacturingDate;
        ExpirationDate = expirationDate;
    }

    public void AdjustStock(int quantityChange)
    {
        var newQuantity = QuantityOnHand + quantityChange;

        if (newQuantity < 0)
        {
            throw new DomainException(new Error("Inventory.InsufficientStock", "Stock quantity cannot be negative."));
        }

        QuantityOnHand = newQuantity;
    }
}
