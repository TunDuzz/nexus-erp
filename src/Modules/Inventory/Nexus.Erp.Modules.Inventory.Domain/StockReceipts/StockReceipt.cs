using Nexus.Erp.SharedKernel.Domain;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Domain.StockReceipts;

public sealed class StockReceipt : Entity<Guid>
{
    private readonly List<StockReceiptLine> _lines = [];

    private StockReceipt()
    {
    }

    public StockReceipt(
        Guid id,
        string receiptNumber,
        string supplierName,
        DateTimeOffset receivedAtUtc,
        string? note,
        IEnumerable<StockReceiptLine> lines)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(receiptNumber))
        {
            throw new DomainException(new Error("Inventory.ReceiptNumberRequired", "Receipt number is required."));
        }

        if (string.IsNullOrWhiteSpace(supplierName))
        {
            throw new DomainException(new Error("Inventory.SupplierRequired", "Supplier name is required."));
        }

        _lines = lines.ToList();

        if (_lines.Count == 0)
        {
            throw new DomainException(new Error("Inventory.ReceiptLinesRequired", "Stock receipt must contain at least one line."));
        }

        ReceiptNumber = receiptNumber.Trim();
        SupplierName = supplierName.Trim();
        ReceivedAtUtc = receivedAtUtc;
        Note = note?.Trim();
    }

    public string ReceiptNumber { get; private set; } = string.Empty;

    public string SupplierName { get; private set; } = string.Empty;

    public DateTimeOffset ReceivedAtUtc { get; private set; }

    public string? Note { get; private set; }

    public IReadOnlyCollection<StockReceiptLine> Lines => _lines.AsReadOnly();
}
