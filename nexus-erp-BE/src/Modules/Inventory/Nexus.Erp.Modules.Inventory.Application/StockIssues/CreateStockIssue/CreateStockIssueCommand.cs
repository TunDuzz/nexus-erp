using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.CreateStockIssue;

public sealed record CreateStockIssueCommand(
    string IssueNumber,
    string RequestedBy,
    DateTimeOffset? IssuedAtUtc,
    string? Note,
    IReadOnlyCollection<CreateStockIssueLine> Lines) : ICommand<StockIssueResponse>;

public sealed record CreateStockIssueLine(
    string Sku,
    int Quantity,
    string? Reason);
