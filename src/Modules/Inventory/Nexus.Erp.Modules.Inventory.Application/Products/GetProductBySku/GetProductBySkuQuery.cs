using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;

public sealed record GetProductBySkuQuery(string Sku) : IQuery<ProductResponse>;
