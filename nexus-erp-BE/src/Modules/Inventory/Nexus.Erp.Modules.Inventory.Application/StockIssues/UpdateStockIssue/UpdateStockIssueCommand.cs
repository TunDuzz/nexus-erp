using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.UpdateStockIssue;

public sealed record UpdateStockIssueCommand(
    Guid IssueId,
    string IssueNumber,
    string RequestedBy,
    DateTimeOffset? IssuedAtUtc,
    string? Note,
    IReadOnlyCollection<UpdateStockIssueLine> Lines) : ICommand<StockIssueResponse>;

public sealed record UpdateStockIssueLine(
    string Sku,
    int Quantity,
    string? Reason);
