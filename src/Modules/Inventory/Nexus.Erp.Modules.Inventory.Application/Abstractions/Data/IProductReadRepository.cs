using Nexus.Erp.Modules.Inventory.Domain.Products;

namespace Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;

public interface IProductReadRepository
{
    Task<IReadOnlyCollection<Product>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Product?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default);
}
