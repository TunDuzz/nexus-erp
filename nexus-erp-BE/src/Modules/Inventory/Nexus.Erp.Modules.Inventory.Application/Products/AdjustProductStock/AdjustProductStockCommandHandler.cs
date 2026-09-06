using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.Products.AdjustProductStock;

internal sealed class AdjustProductStockCommandHandler(IProductRepository products)
    : IRequestHandler<AdjustProductStockCommand, Result<ProductResponse>>
{
    public async Task<Result<ProductResponse>> Handle(
        AdjustProductStockCommand request,
        CancellationToken cancellationToken)
    {
        if (request.QuantityChange == 0)
        {
            return Result<ProductResponse>.Failure(new Error("Inventory.StockAdjustmentInvalid", "Quantity change must be different from zero."));
        }

        var product = await products.GetBySkuAsync(request.Sku, cancellationToken);

        if (product is null)
        {
            return Result<ProductResponse>.Failure(new Error("Inventory.ProductNotFound", "Product was not found."));
        }

        product.AdjustStock(request.QuantityChange);
        await products.SaveChangesAsync(cancellationToken);

        return Result<ProductResponse>.Success(ProductMapper.ToResponse(product));
    }
}
