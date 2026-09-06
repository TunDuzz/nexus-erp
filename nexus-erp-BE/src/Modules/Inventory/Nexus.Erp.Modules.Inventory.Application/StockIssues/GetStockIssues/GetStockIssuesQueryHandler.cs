using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockIssues.GetStockIssues;

internal sealed class GetStockIssuesQueryHandler(IStockIssueRepository stockIssues)
    : IRequestHandler<GetStockIssuesQuery, Result<IReadOnlyCollection<StockIssueResponse>>>
{
    public async Task<Result<IReadOnlyCollection<StockIssueResponse>>> Handle(
        GetStockIssuesQuery request,
        CancellationToken cancellationToken)
    {
        var issues = (await stockIssues.GetAllAsync(cancellationToken))
            .Select(StockIssueMapper.ToResponse)
            .ToArray();

        return Result<IReadOnlyCollection<StockIssueResponse>>.Success(issues);
    }
}
