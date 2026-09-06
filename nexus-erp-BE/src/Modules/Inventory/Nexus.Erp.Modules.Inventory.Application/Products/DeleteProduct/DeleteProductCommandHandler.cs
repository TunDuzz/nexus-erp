using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.Products.DeleteProduct;

internal sealed class DeleteProductCommandHandler(
    IProductRepository products,
    IStockReceiptRepository stockReceipts,
    IStockIssueRepository stockIssues)
    : IRequestHandler<DeleteProductCommand, Result>
{
    public async Task<Result> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await products.GetBySkuAsync(request.Sku, cancellationToken);

        if (product is null)
        {
            return Result.Failure(new Error("Inventory.ProductNotFound", "Product was not found."));
        }

        if (await stockReceipts.ContainsSkuAsync(product.Sku, cancellationToken) ||
            await stockIssues.ContainsSkuAsync(product.Sku, cancellationToken))
        {
            return Result.Failure(new Error(
                "Inventory.ProductInUse",
                "Product cannot be deleted because it already has stock receipts or stock issues."));
        }

        products.Remove(product);
        await products.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
