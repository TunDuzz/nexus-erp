using Nexus.Erp.Modules.Inventory.Domain.StockIssues;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues;

internal static class StockIssueMapper
{
    public static StockIssueResponse ToResponse(StockIssue issue)
    {
        return new StockIssueResponse(
            issue.Id,
            issue.IssueNumber,
            issue.RequestedBy,
            issue.IssuedAtUtc,
            issue.Note,
            issue.Lines
                .Select(line => new StockIssueLineResponse(
                    line.Id,
                    line.Sku,
                    line.Quantity,
                    line.Reason))
                .ToArray());
    }
}
