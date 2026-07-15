namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts;

public sealed record StockReceiptResponse(
    Guid Id,
    string ReceiptNumber,
    string SupplierName,
    DateTimeOffset ReceivedAtUtc,
    string? Note,
    IReadOnlyCollection<StockReceiptLineResponse> Lines);

public sealed record StockReceiptLineResponse(
    Guid Id,
    string Sku,
    int Quantity,
    decimal UnitCost,
    decimal LineTotal);
