using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.DeleteStockReceipt;

internal sealed class DeleteStockReceiptCommandHandler(
    IProductRepository products,
    IStockReceiptRepository stockReceipts)
    : IRequestHandler<DeleteStockReceiptCommand, Result>
{
    public async Task<Result> Handle(DeleteStockReceiptCommand request, CancellationToken cancellationToken)
    {
        var receipt = await stockReceipts.GetByIdForUpdateAsync(request.ReceiptId, cancellationToken);

        if (receipt is null)
        {
            return Result.Failure(new Error("Inventory.StockReceiptNotFound", "Stock receipt was not found."));
        }

        foreach (var line in receipt.Lines)
        {
            var product = await products.GetBySkuAsync(line.Sku, cancellationToken);

            if (product is null)
            {
                return Result.Failure(new Error("Inventory.ProductNotFound", $"Product '{line.Sku}' was not found."));
            }

            if (product.QuantityOnHand < line.Quantity)
            {
                return Result.Failure(new Error(
                    "Inventory.StockReceiptCannotBeDeleted",
                    "Stock receipt cannot be deleted because it would make stock quantity negative."));
            }

            product.AdjustStock(-line.Quantity);
        }

        stockReceipts.Remove(receipt);
        await products.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
