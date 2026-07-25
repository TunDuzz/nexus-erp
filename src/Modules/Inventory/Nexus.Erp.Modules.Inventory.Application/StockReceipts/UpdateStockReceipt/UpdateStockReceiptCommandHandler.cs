using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Domain.StockReceipts;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.UpdateStockReceipt;

internal sealed class UpdateStockReceiptCommandHandler(
    IProductRepository products,
    IStockReceiptRepository stockReceipts)
    : IRequestHandler<UpdateStockReceiptCommand, Result<StockReceiptResponse>>
{
    public async Task<Result<StockReceiptResponse>> Handle(UpdateStockReceiptCommand request, CancellationToken cancellationToken)
    {
        var receipt = await stockReceipts.GetByIdForUpdateAsync(request.ReceiptId, cancellationToken);

        if (receipt is null)
        {
            return Result<StockReceiptResponse>.Failure(new Error("Inventory.StockReceiptNotFound", "Stock receipt was not found."));
        }

        if (!string.Equals(receipt.ReceiptNumber, request.ReceiptNumber, StringComparison.OrdinalIgnoreCase) &&
            await stockReceipts.ExistsByReceiptNumberAsync(request.ReceiptNumber, cancellationToken))
        {
            return Result<StockReceiptResponse>.Failure(new Error("Inventory.ReceiptNumberAlreadyExists", "Receipt number already exists."));
        }

        if (request.Lines.Count == 0 || request.Lines.Select(line => line.Sku.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != request.Lines.Count)
        {
            return Result<StockReceiptResponse>.Failure(new Error("Inventory.ReceiptLinesInvalid", "Stock receipt lines must be unique and not empty."));
        }

        var oldQuantities = receipt.Lines
            .GroupBy(line => line.Sku, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Sum(line => line.Quantity), StringComparer.OrdinalIgnoreCase);

        var newLines = new List<StockReceiptLine>();
        var newQuantities = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var requestLine in request.Lines)
        {
            var sku = requestLine.Sku.Trim();
            var product = await products.GetBySkuAsync(sku, cancellationToken);

            if (product is null)
            {
                return Result<StockReceiptResponse>.Failure(new Error("Inventory.ProductNotFound", $"Product '{sku}' was not found."));
            }

            newQuantities[sku] = requestLine.Quantity;
            newLines.Add(new StockReceiptLine(Guid.NewGuid(), sku, requestLine.Quantity, requestLine.UnitCost));
        }

        foreach (var sku in oldQuantities.Keys.Union(newQuantities.Keys, StringComparer.OrdinalIgnoreCase))
        {
            var product = await products.GetBySkuAsync(sku, cancellationToken);

            if (product is null)
            {
                return Result<StockReceiptResponse>.Failure(new Error("Inventory.ProductNotFound", $"Product '{sku}' was not found."));
            }

            var oldQuantity = oldQuantities.GetValueOrDefault(sku);
            var newQuantity = newQuantities.GetValueOrDefault(sku);
            var delta = newQuantity - oldQuantity;

            if (product.QuantityOnHand + delta < 0)
            {
                return Result<StockReceiptResponse>.Failure(new Error("Inventory.StockReceiptCannotBeUpdated", "Stock receipt cannot be updated because it would make stock quantity negative."));
            }

            if (delta != 0)
            {
                product.AdjustStock(delta);
            }
        }

        receipt.UpdateDetails(
            request.ReceiptNumber,
            request.SupplierName,
            request.ReceivedAtUtc ?? receipt.ReceivedAtUtc,
            request.Note,
            newLines);

        stockReceipts.AddLines(newLines);

        await products.SaveChangesAsync(cancellationToken);

        return Result<StockReceiptResponse>.Success(StockReceiptMapper.ToResponse(receipt));
    }
}

