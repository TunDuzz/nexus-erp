using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.GetStockReceiptById;

internal sealed class GetStockReceiptByIdQueryHandler(IStockReceiptRepository stockReceipts)
    : IRequestHandler<GetStockReceiptByIdQuery, Result<StockReceiptResponse>>
{
    public async Task<Result<StockReceiptResponse>> Handle(
        GetStockReceiptByIdQuery request,
        CancellationToken cancellationToken)
    {
        var receipt = await stockReceipts.GetByIdAsync(request.ReceiptId, cancellationToken);

        return receipt is null
            ? Result<StockReceiptResponse>.Failure(new Error("Inventory.StockReceiptNotFound", "Stock receipt was not found."))
            : Result<StockReceiptResponse>.Success(StockReceiptMapper.ToResponse(receipt));
    }
}
