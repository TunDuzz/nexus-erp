using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Domain.StockIssues;

public sealed class StockIssueLine
{
    private StockIssueLine()
    {
    }

    public StockIssueLine(Guid id, string sku, int quantity, string? reason)
    {
        if (string.IsNullOrWhiteSpace(sku))
        {
            throw new DomainException(new Error("Inventory.IssueLineSkuRequired", "Issue line SKU is required."));
        }

        if (quantity <= 0)
        {
            throw new DomainException(new Error("Inventory.IssueQuantityInvalid", "Issue quantity must be greater than zero."));
        }

        Id = id;
        Sku = sku.Trim();
        Quantity = quantity;
        Reason = reason?.Trim();
    }

    public Guid Id { get; private set; }

    public Guid StockIssueId { get; private set; }

    public string Sku { get; private set; } = string.Empty;

    public int Quantity { get; private set; }

    public string? Reason { get; private set; }
}
