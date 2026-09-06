using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.GetStockReceipts;

internal sealed class GetStockReceiptsQueryHandler(IStockReceiptRepository stockReceipts)
    : IRequestHandler<GetStockReceiptsQuery, Result<IReadOnlyCollection<StockReceiptResponse>>>
{
    public async Task<Result<IReadOnlyCollection<StockReceiptResponse>>> Handle(
        GetStockReceiptsQuery request,
        CancellationToken cancellationToken)
    {
        var receipts = (await stockReceipts.GetAllAsync(cancellationToken))
            .Select(StockReceiptMapper.ToResponse)
            .ToArray();

        return Result<IReadOnlyCollection<StockReceiptResponse>>.Success(receipts);
    }
}
