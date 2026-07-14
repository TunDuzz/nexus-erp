using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Domain.Products;
using Nexus.Erp.Modules.Inventory.Infrastructure.Persistence;

namespace Nexus.Erp.Modules.Inventory.Infrastructure.Repositories;

internal sealed class ProductRepository(InventoryDbContext dbContext) : IProductRepository
{
    public async Task AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        await dbContext.Products.AddAsync(product, cancellationToken);
    }

    public Task<Product?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        return dbContext.Products
            .FirstOrDefaultAsync(product => product.Sku == sku, cancellationToken);
    }

    public Task<bool> ExistsBySkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        return dbContext.Products.AnyAsync(product => product.Sku == sku, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
