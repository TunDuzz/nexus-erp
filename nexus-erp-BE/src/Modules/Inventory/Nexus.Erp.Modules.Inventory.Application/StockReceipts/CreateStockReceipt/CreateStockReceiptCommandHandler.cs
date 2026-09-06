using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Domain.StockReceipts;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.CreateStockReceipt;

internal sealed class CreateStockReceiptCommandHandler(
    IProductRepository products,
    IStockReceiptRepository stockReceipts)
    : IRequestHandler<CreateStockReceiptCommand, Result<StockReceiptResponse>>
{
    public async Task<Result<StockReceiptResponse>> Handle(
        CreateStockReceiptCommand request,
        CancellationToken cancellationToken)
    {
        if (await stockReceipts.ExistsByReceiptNumberAsync(request.ReceiptNumber, cancellationToken))
        {
            return Result<StockReceiptResponse>.Failure(new Error("Inventory.ReceiptNumberAlreadyExists", "Receipt number already exists."));
        }

        var lines = new List<StockReceiptLine>();

        foreach (var requestLine in request.Lines)
        {
            var product = await products.GetBySkuAsync(requestLine.Sku, cancellationToken);

            if (product is null)
            {
                return Result<StockReceiptResponse>.Failure(new Error("Inventory.ProductNotFound", $"Product '{requestLine.Sku}' was not found."));
            }

            product.AdjustStock(requestLine.Quantity);
            lines.Add(new StockReceiptLine(Guid.NewGuid(), requestLine.Sku, requestLine.Quantity, requestLine.UnitCost));
        }

        var receipt = new StockReceipt(
            Guid.NewGuid(),
            request.ReceiptNumber,
            request.SupplierName,
            request.ReceivedAtUtc ?? DateTimeOffset.UtcNow,
            request.Note,
            lines);

        await stockReceipts.AddAsync(receipt, cancellationToken);
        await products.SaveChangesAsync(cancellationToken);

        return Result<StockReceiptResponse>.Success(StockReceiptMapper.ToResponse(receipt));
    }
}
