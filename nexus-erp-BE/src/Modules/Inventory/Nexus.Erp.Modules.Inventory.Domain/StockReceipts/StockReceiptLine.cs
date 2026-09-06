using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Domain.StockReceipts;

public sealed class StockReceiptLine
{
    private StockReceiptLine()
    {
    }

    public StockReceiptLine(Guid id, string sku, int quantity, decimal unitCost)
    {
        if (string.IsNullOrWhiteSpace(sku))
        {
            throw new DomainException(new Error("Inventory.ReceiptLineSkuRequired", "Receipt line SKU is required."));
        }

        if (quantity <= 0)
        {
            throw new DomainException(new Error("Inventory.ReceiptQuantityInvalid", "Receipt quantity must be greater than zero."));
        }

        if (unitCost < 0)
        {
            throw new DomainException(new Error("Inventory.ReceiptUnitCostInvalid", "Receipt unit cost cannot be negative."));
        }

        Id = id;
        Sku = sku.Trim();
        Quantity = quantity;
        UnitCost = unitCost;
    }

    public Guid Id { get; private set; }

    public Guid StockReceiptId { get; private set; }

    public string Sku { get; private set; } = string.Empty;

    public int Quantity { get; private set; }

    public decimal UnitCost { get; private set; }
}
