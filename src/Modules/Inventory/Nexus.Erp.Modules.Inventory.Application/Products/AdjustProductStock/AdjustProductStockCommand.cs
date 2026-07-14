using Nexus.Erp.Application.Abstractions.Messaging;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;

namespace Nexus.Erp.Modules.Inventory.Application.Products.AdjustProductStock;

public sealed record AdjustProductStockCommand(
    string Sku,
    int QuantityChange,
    string? Reason) : ICommand<ProductResponse>;
