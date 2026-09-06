using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Domain.StockIssues;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.UpdateStockIssue;

internal sealed class UpdateStockIssueCommandHandler(
    IProductRepository products,
    IStockIssueRepository stockIssues)
    : IRequestHandler<UpdateStockIssueCommand, Result<StockIssueResponse>>
{
    public async Task<Result<StockIssueResponse>> Handle(UpdateStockIssueCommand request, CancellationToken cancellationToken)
    {
        var issue = await stockIssues.GetByIdForUpdateAsync(request.IssueId, cancellationToken);

        if (issue is null)
        {
            return Result<StockIssueResponse>.Failure(new Error("Inventory.StockIssueNotFound", "Stock issue was not found."));
        }

        if (!string.Equals(issue.IssueNumber, request.IssueNumber, StringComparison.OrdinalIgnoreCase) &&
            await stockIssues.ExistsByIssueNumberAsync(request.IssueNumber, cancellationToken))
        {
            return Result<StockIssueResponse>.Failure(new Error("Inventory.IssueNumberAlreadyExists", "Issue number already exists."));
        }

        if (request.Lines.Count == 0 || request.Lines.Select(line => line.Sku.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != request.Lines.Count)
        {
            return Result<StockIssueResponse>.Failure(new Error("Inventory.IssueLinesInvalid", "Stock issue lines must be unique and not empty."));
        }

        var oldQuantities = issue.Lines
            .GroupBy(line => line.Sku, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Sum(line => line.Quantity), StringComparer.OrdinalIgnoreCase);

        var newLines = new List<StockIssueLine>();
        var newQuantities = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var requestLine in request.Lines)
        {
            var sku = requestLine.Sku.Trim();
            var product = await products.GetBySkuAsync(sku, cancellationToken);

            if (product is null)
            {
                return Result<StockIssueResponse>.Failure(new Error("Inventory.ProductNotFound", $"Product '{sku}' was not found."));
            }

            newQuantities[sku] = requestLine.Quantity;
            newLines.Add(new StockIssueLine(Guid.NewGuid(), sku, requestLine.Quantity, requestLine.Reason));
        }

        foreach (var sku in oldQuantities.Keys.Union(newQuantities.Keys, StringComparer.OrdinalIgnoreCase))
        {
            var product = await products.GetBySkuAsync(sku, cancellationToken);

            if (product is null)
            {
                return Result<StockIssueResponse>.Failure(new Error("Inventory.ProductNotFound", $"Product '{sku}' was not found."));
            }

            var oldQuantity = oldQuantities.GetValueOrDefault(sku);
            var newQuantity = newQuantities.GetValueOrDefault(sku);
            var delta = oldQuantity - newQuantity;

            if (product.QuantityOnHand + delta < 0)
            {
                return Result<StockIssueResponse>.Failure(new Error("Inventory.StockIssueCannotBeUpdated", "Stock issue cannot be updated because stock is insufficient."));
            }

            if (delta != 0)
            {
                product.AdjustStock(delta);
            }
        }

        issue.UpdateDetails(
            request.IssueNumber,
            request.RequestedBy,
            request.IssuedAtUtc ?? issue.IssuedAtUtc,
            request.Note,
            newLines);

        stockIssues.AddLines(newLines);

        await products.SaveChangesAsync(cancellationToken);

        return Result<StockIssueResponse>.Success(StockIssueMapper.ToResponse(issue));
    }
}

