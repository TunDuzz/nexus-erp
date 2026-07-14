using Nexus.Erp.Application.Abstractions.Messaging;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;

namespace Nexus.Erp.Modules.Inventory.Application.Products.GetProducts;

public sealed record GetProductsQuery : IQuery<IReadOnlyCollection<ProductResponse>>;
