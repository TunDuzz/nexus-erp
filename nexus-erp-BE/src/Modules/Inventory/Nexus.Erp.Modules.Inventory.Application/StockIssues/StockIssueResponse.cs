namespace Nexus.Erp.Modules.Inventory.Application.StockIssues;

public sealed record StockIssueResponse(
    Guid Id,
    string IssueNumber,
    string RequestedBy,
    DateTimeOffset IssuedAtUtc,
    string? Note,
    IReadOnlyCollection<StockIssueLineResponse> Lines);

public sealed record StockIssueLineResponse(
    Guid Id,
    string Sku,
    int Quantity,
    string? Reason);
