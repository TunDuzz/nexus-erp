using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.UpdateStockReceipt;

public sealed record UpdateStockReceiptCommand(
    Guid ReceiptId,
    string ReceiptNumber,
    string SupplierName,
    DateTimeOffset? ReceivedAtUtc,
    string? Note,
    IReadOnlyCollection<UpdateStockReceiptLine> Lines) : ICommand<StockReceiptResponse>;

public sealed record UpdateStockReceiptLine(
    string Sku,
    int Quantity,
    decimal UnitCost);
