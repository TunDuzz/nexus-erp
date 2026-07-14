using MediatR;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Application.Products.GetProducts;

internal sealed class GetProductsQueryHandler(IProductReadRepository products)
    : IRequestHandler<GetProductsQuery, Result<IReadOnlyCollection<ProductResponse>>>
{
    public async Task<Result<IReadOnlyCollection<ProductResponse>>> Handle(
        GetProductsQuery request,
        CancellationToken cancellationToken)
    {
        var productResponses = (await products.GetAllAsync(cancellationToken))
            .Select(ProductMapper.ToResponse)
            .ToArray();

        return Result<IReadOnlyCollection<ProductResponse>>.Success(productResponses);
    }
}
