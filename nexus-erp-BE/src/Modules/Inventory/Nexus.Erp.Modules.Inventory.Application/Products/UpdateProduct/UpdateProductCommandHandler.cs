using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.Products.UpdateProduct;

internal sealed class UpdateProductCommandHandler(IProductRepository products)
    : IRequestHandler<UpdateProductCommand, Result<ProductResponse>>
{
    public async Task<Result<ProductResponse>> Handle(
        UpdateProductCommand request,
        CancellationToken cancellationToken)
    {
        var product = await products.GetBySkuAsync(request.Sku, cancellationToken);

        if (product is null)
        {
            return Result<ProductResponse>.Failure(new Error("Inventory.ProductNotFound", "Product was not found."));
        }

        product.UpdateDetails(request.Name, request.UnitOfMeasure, request.UnitPrice, request.ReorderLevel, request.ManufacturingDate, request.ExpirationDate);
        await products.SaveChangesAsync(cancellationToken);

        return Result<ProductResponse>.Success(ProductMapper.ToResponse(product));
    }
}

