using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.DeleteStockIssue;

public sealed record DeleteStockIssueCommand(Guid IssueId) : ICommand;
