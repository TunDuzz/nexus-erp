using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Application.Products;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;

internal sealed class GetProductBySkuQueryHandler(IProductReadRepository products)
    : IRequestHandler<GetProductBySkuQuery, Result<ProductResponse>>
{
    public async Task<Result<ProductResponse>> Handle(
        GetProductBySkuQuery request,
        CancellationToken cancellationToken)
    {
        var product = await products.GetBySkuAsync(request.Sku, cancellationToken);

        if (product is null)
        {
            return Result<ProductResponse>.Failure(new Error("Inventory.ProductNotFound", "Product was not found."));
        }

        return Result<ProductResponse>.Success(ProductMapper.ToResponse(product));
    }
}


