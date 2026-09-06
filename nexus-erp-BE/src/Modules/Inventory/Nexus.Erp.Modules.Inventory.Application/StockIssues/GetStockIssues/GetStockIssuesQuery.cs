using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.GetStockIssues;

public sealed record GetStockIssuesQuery : IQuery<IReadOnlyCollection<StockIssueResponse>>;
