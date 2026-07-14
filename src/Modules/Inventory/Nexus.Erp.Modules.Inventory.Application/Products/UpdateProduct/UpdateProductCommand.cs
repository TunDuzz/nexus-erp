using Nexus.Erp.Application.Abstractions.Messaging;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;

namespace Nexus.Erp.Modules.Inventory.Application.Products.UpdateProduct;

public sealed record UpdateProductCommand(
    string Sku,
    string Name,
    decimal UnitPrice,
    int ReorderLevel) : ICommand<ProductResponse>;
