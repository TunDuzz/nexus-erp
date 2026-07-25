using Nexus.Erp.SharedKernel.Domain;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Domain.StockIssues;

public sealed class StockIssue : Entity<Guid>
{
    private readonly List<StockIssueLine> _lines = [];

    private StockIssue()
    {
    }

    public StockIssue(
        Guid id,
        string issueNumber,
        string requestedBy,
        DateTimeOffset issuedAtUtc,
        string? note,
        IEnumerable<StockIssueLine> lines)
        : base(id)
    {
        UpdateDetails(issueNumber, requestedBy, issuedAtUtc, note, lines);
    }

    public string IssueNumber { get; private set; } = string.Empty;

    public string RequestedBy { get; private set; } = string.Empty;

    public DateTimeOffset IssuedAtUtc { get; private set; }

    public string? Note { get; private set; }

    public IReadOnlyCollection<StockIssueLine> Lines => _lines.AsReadOnly();

    public void UpdateDetails(
        string issueNumber,
        string requestedBy,
        DateTimeOffset issuedAtUtc,
        string? note,
        IEnumerable<StockIssueLine> lines)
    {
        if (string.IsNullOrWhiteSpace(issueNumber))
        {
            throw new DomainException(new Error("Inventory.IssueNumberRequired", "Issue number is required."));
        }

        if (string.IsNullOrWhiteSpace(requestedBy))
        {
            throw new DomainException(new Error("Inventory.IssueRequesterRequired", "Issue requester is required."));
        }

        var lineList = lines.ToList();

        if (lineList.Count == 0)
        {
            throw new DomainException(new Error("Inventory.IssueLinesRequired", "Stock issue must contain at least one line."));
        }

        IssueNumber = issueNumber.Trim();
        RequestedBy = requestedBy.Trim();
        IssuedAtUtc = issuedAtUtc;
        Note = note?.Trim();
        _lines.Clear();
        _lines.AddRange(lineList);
    }
}
