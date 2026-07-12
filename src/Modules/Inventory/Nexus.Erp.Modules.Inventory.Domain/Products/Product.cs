using Nexus.Erp.SharedKernel.Domain;

namespace Nexus.Erp.Modules.Inventory.Domain.Products;

public sealed class Product : Entity<Guid>
{
    private Product()
    {
    }

    public Product(Guid id, string sku, string name, decimal unitPrice)
        : base(id)
    {
        Sku = sku;
        Name = name;
        UnitPrice = unitPrice;
    }

    public string Sku { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public decimal UnitPrice { get; private set; }
}
