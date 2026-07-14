using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;
using Nexus.Erp.Modules.Inventory.Domain.Products;

namespace Nexus.Erp.Modules.Inventory.Application.Products;

internal static class ProductMapper
{
    public static ProductResponse ToResponse(Product product)
    {
        return new ProductResponse(
            product.Id,
            product.Sku,
            product.Name,
            product.UnitPrice,
            product.QuantityOnHand,
            product.ReorderLevel,
            product.IsBelowReorderLevel);
    }
}
