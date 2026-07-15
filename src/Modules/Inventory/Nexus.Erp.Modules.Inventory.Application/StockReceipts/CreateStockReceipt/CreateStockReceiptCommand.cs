using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.CreateStockReceipt;

public sealed record CreateStockReceiptCommand(
    string ReceiptNumber,
    string SupplierName,
    DateTimeOffset? ReceivedAtUtc,
    string? Note,
    IReadOnlyCollection<CreateStockReceiptLine> Lines) : ICommand<StockReceiptResponse>;

public sealed record CreateStockReceiptLine(
    string Sku,
    int Quantity,
    decimal UnitCost);
