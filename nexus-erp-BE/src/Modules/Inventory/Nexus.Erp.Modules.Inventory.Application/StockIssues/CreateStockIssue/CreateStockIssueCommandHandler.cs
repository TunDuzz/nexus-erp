using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Domain.StockIssues;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.CreateStockIssue;

internal sealed class CreateStockIssueCommandHandler(
    IProductRepository products,
    IStockIssueRepository stockIssues)
    : IRequestHandler<CreateStockIssueCommand, Result<StockIssueResponse>>
{
    public async Task<Result<StockIssueResponse>> Handle(
        CreateStockIssueCommand request,
        CancellationToken cancellationToken)
    {
        if (await stockIssues.ExistsByIssueNumberAsync(request.IssueNumber, cancellationToken))
        {
            return Result<StockIssueResponse>.Failure(new Error("Inventory.IssueNumberAlreadyExists", "Issue number already exists."));
        }

        var lines = new List<StockIssueLine>();

        foreach (var requestLine in request.Lines)
        {
            var product = await products.GetBySkuAsync(requestLine.Sku, cancellationToken);

            if (product is null)
            {
                return Result<StockIssueResponse>.Failure(new Error("Inventory.ProductNotFound", $"Product '{requestLine.Sku}' was not found."));
            }

            product.AdjustStock(-requestLine.Quantity);
            lines.Add(new StockIssueLine(Guid.NewGuid(), requestLine.Sku, requestLine.Quantity, requestLine.Reason));
        }

        var issue = new StockIssue(
            Guid.NewGuid(),
            request.IssueNumber,
            request.RequestedBy,
            request.IssuedAtUtc ?? DateTimeOffset.UtcNow,
            request.Note,
            lines);

        await stockIssues.AddAsync(issue, cancellationToken);
        await products.SaveChangesAsync(cancellationToken);

        return Result<StockIssueResponse>.Success(StockIssueMapper.ToResponse(issue));
    }
}
