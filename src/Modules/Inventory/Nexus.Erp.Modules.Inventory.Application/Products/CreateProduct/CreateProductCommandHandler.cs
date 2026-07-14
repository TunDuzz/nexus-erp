using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;
using Nexus.Erp.Modules.Inventory.Domain.Products;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.Products.CreateProduct;

internal sealed class CreateProductCommandHandler(IProductRepository products)
    : IRequestHandler<CreateProductCommand, Result<ProductResponse>>
{
    public async Task<Result<ProductResponse>> Handle(
        CreateProductCommand request,
        CancellationToken cancellationToken)
    {
        if (await products.ExistsBySkuAsync(request.Sku, cancellationToken))
        {
            return Result<ProductResponse>.Failure(new Error("Inventory.ProductSkuAlreadyExists", "Product SKU already exists."));
        }

        var product = new Product(
            Guid.NewGuid(),
            request.Sku,
            request.Name,
            request.UnitPrice,
            request.InitialQuantity,
            request.ReorderLevel);

        await products.AddAsync(product, cancellationToken);
        await products.SaveChangesAsync(cancellationToken);

        return Result<ProductResponse>.Success(ProductMapper.ToResponse(product));
    }
}
