using Nexus.Erp.Application.Abstractions.Messaging;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;

namespace Nexus.Erp.Modules.Inventory.Application.Products.CreateProduct;

public sealed record CreateProductCommand(
    string Sku,
    string Name,
    decimal UnitPrice,
    int InitialQuantity,
    int ReorderLevel) : ICommand<ProductResponse>;
