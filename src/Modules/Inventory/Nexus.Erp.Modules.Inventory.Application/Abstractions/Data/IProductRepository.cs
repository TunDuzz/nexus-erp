using Nexus.Erp.Modules.Inventory.Domain.Products;

namespace Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;

public interface IProductRepository
{
    Task AddAsync(Product product, CancellationToken cancellationToken = default);

    Task<Product?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default);

    Task<bool> ExistsBySkuAsync(string sku, CancellationToken cancellationToken = default);

    void Remove(Product product);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
