using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Domain.StockReceipts;
using Nexus.Erp.Modules.Inventory.Infrastructure.Persistence;

namespace Nexus.Erp.Modules.Inventory.Infrastructure.Repositories;

internal sealed class StockReceiptRepository(InventoryDbContext dbContext) : IStockReceiptRepository
{
    public async Task AddAsync(StockReceipt receipt, CancellationToken cancellationToken = default)
    {
        await dbContext.StockReceipts.AddAsync(receipt, cancellationToken);
    }

    public Task<bool> ExistsByReceiptNumberAsync(string receiptNumber, CancellationToken cancellationToken = default)
    {
        return dbContext.StockReceipts.AnyAsync(receipt => receipt.ReceiptNumber == receiptNumber, cancellationToken);
    }

    public Task<bool> ContainsSkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        return dbContext.StockReceipts
            .AnyAsync(receipt => receipt.Lines.Any(line => line.Sku == sku), cancellationToken);
    }

    public Task<StockReceipt?> GetByIdAsync(Guid receiptId, CancellationToken cancellationToken = default)
    {
        return dbContext.StockReceipts
            .AsNoTracking()
            .Include(receipt => receipt.Lines)
            .FirstOrDefaultAsync(receipt => receipt.Id == receiptId, cancellationToken);
    }

    public Task<StockReceipt?> GetByIdForUpdateAsync(Guid receiptId, CancellationToken cancellationToken = default)
    {
        return dbContext.StockReceipts
            .Include(receipt => receipt.Lines)
            .FirstOrDefaultAsync(receipt => receipt.Id == receiptId, cancellationToken);
    }

    public async Task<IReadOnlyCollection<StockReceipt>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.StockReceipts
            .AsNoTracking()
            .Include(receipt => receipt.Lines)
            .OrderByDescending(receipt => receipt.ReceivedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public void AddLines(IEnumerable<StockReceiptLine> lines)
    {
        dbContext.Set<StockReceiptLine>().AddRange(lines);
    }

    public void Remove(StockReceipt receipt)
    {
        dbContext.StockReceipts.Remove(receipt);
    }
}

