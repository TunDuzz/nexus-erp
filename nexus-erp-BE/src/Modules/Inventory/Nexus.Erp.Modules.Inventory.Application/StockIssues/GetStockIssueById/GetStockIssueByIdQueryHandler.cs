using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.GetStockIssueById;

internal sealed class GetStockIssueByIdQueryHandler(IStockIssueRepository stockIssues)
    : IRequestHandler<GetStockIssueByIdQuery, Result<StockIssueResponse>>
{
    public async Task<Result<StockIssueResponse>> Handle(
        GetStockIssueByIdQuery request,
        CancellationToken cancellationToken)
    {
        var issue = await stockIssues.GetByIdAsync(request.IssueId, cancellationToken);

        return issue is null
            ? Result<StockIssueResponse>.Failure(new Error("Inventory.StockIssueNotFound", "Stock issue was not found."))
            : Result<StockIssueResponse>.Success(StockIssueMapper.ToResponse(issue));
    }
}
