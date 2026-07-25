namespace Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;

public sealed record ProductResponse(
    Guid Id,
    string Sku,
    string Name,
    string UnitOfMeasure,
    decimal UnitPrice,
    int QuantityOnHand,
    int ReorderLevel,
    DateOnly? ManufacturingDate,
    DateOnly? ExpirationDate,
    bool IsBelowReorderLevel);
