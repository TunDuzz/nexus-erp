using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Domain.Products;
using Nexus.Erp.Modules.Inventory.Infrastructure.Persistence;

namespace Nexus.Erp.Modules.Inventory.Infrastructure.Repositories;

internal sealed class ProductReadRepository(InventoryDbContext dbContext) : IProductReadRepository
{
    public async Task<IReadOnlyCollection<Product>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Products
            .AsNoTracking()
            .OrderBy(product => product.Name)
            .ToArrayAsync(cancellationToken);
    }

    public Task<Product?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        return dbContext.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(product => product.Sku == sku, cancellationToken);
    }
}
