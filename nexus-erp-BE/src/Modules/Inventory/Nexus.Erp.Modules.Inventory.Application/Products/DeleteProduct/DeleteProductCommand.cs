using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.Products.DeleteProduct;

public sealed record DeleteProductCommand(string Sku) : ICommand;
