using Nexus.Erp.SharedKernel.Domain;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Domain.Products;

public sealed class Product : Entity<Guid>
{
    private Product()
    {
    }

    public Product(Guid id, string sku, string name, decimal unitPrice, int initialQuantity, int reorderLevel)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(sku))
        {
            throw new DomainException(new Error("Inventory.ProductSkuRequired", "Product SKU is required."));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException(new Error("Inventory.ProductNameRequired", "Product name is required."));
        }

        if (unitPrice < 0)
        {
            throw new DomainException(new Error("Inventory.ProductPriceInvalid", "Unit price cannot be negative."));
        }

        if (initialQuantity < 0)
        {
            throw new DomainException(new Error("Inventory.ProductQuantityInvalid", "Initial quantity cannot be negative."));
        }

        if (reorderLevel < 0)
        {
            throw new DomainException(new Error("Inventory.ProductReorderLevelInvalid", "Reorder level cannot be negative."));
        }

        Sku = sku.Trim();
        Name = name.Trim();
        UnitPrice = unitPrice;
        QuantityOnHand = initialQuantity;
        ReorderLevel = reorderLevel;
    }

    public string Sku { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public decimal UnitPrice { get; private set; }

    public int QuantityOnHand { get; private set; }

    public int ReorderLevel { get; private set; }

    public bool IsBelowReorderLevel => QuantityOnHand <= ReorderLevel;

    public void UpdateDetails(string name, decimal unitPrice, int reorderLevel)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException(new Error("Inventory.ProductNameRequired", "Product name is required."));
        }

        if (unitPrice < 0)
        {
            throw new DomainException(new Error("Inventory.ProductPriceInvalid", "Unit price cannot be negative."));
        }

        if (reorderLevel < 0)
        {
            throw new DomainException(new Error("Inventory.ProductReorderLevelInvalid", "Reorder level cannot be negative."));
        }

        Name = name.Trim();
        UnitPrice = unitPrice;
        ReorderLevel = reorderLevel;
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
