using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.DeleteStockIssue;

internal sealed class DeleteStockIssueCommandHandler(
    IProductRepository products,
    IStockIssueRepository stockIssues)
    : IRequestHandler<DeleteStockIssueCommand, Result>
{
    public async Task<Result> Handle(DeleteStockIssueCommand request, CancellationToken cancellationToken)
    {
        var issue = await stockIssues.GetByIdForUpdateAsync(request.IssueId, cancellationToken);

        if (issue is null)
        {
            return Result.Failure(new Error("Inventory.StockIssueNotFound", "Stock issue was not found."));
        }

        foreach (var line in issue.Lines)
        {
            var product = await products.GetBySkuAsync(line.Sku, cancellationToken);

            if (product is null)
            {
                return Result.Failure(new Error("Inventory.ProductNotFound", $"Product '{line.Sku}' was not found."));
            }

            product.AdjustStock(line.Quantity);
        }

        stockIssues.Remove(issue);
        await products.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
