using Nexus.Erp.Modules.Inventory.Domain.StockReceipts;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts;

internal static class StockReceiptMapper
{
    public static StockReceiptResponse ToResponse(StockReceipt receipt)
    {
        return new StockReceiptResponse(
            receipt.Id,
            receipt.ReceiptNumber,
            receipt.SupplierName,
            receipt.ReceivedAtUtc,
            receipt.Note,
            receipt.Lines
                .Select(line => new StockReceiptLineResponse(
                    line.Id,
                    line.Sku,
                    line.Quantity,
                    line.UnitCost,
                    line.Quantity * line.UnitCost))
                .ToArray());
    }
}
