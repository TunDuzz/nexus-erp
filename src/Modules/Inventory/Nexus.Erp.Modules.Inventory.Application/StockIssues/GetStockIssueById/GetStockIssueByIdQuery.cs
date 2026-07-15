using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.GetStockIssueById;

public sealed record GetStockIssueByIdQuery(Guid IssueId) : IQuery<StockIssueResponse>;
