using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Domain.StockIssues;
using Nexus.Erp.Modules.Inventory.Infrastructure.Persistence;

namespace Nexus.Erp.Modules.Inventory.Infrastructure.Repositories;

internal sealed class StockIssueRepository(InventoryDbContext dbContext) : IStockIssueRepository
{
    public async Task AddAsync(StockIssue issue, CancellationToken cancellationToken = default)
    {
        await dbContext.StockIssues.AddAsync(issue, cancellationToken);
    }

    public Task<bool> ExistsByIssueNumberAsync(string issueNumber, CancellationToken cancellationToken = default)
    {
        return dbContext.StockIssues.AnyAsync(issue => issue.IssueNumber == issueNumber, cancellationToken);
    }

    public Task<bool> ContainsSkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        return dbContext.StockIssues
            .AnyAsync(issue => issue.Lines.Any(line => line.Sku == sku), cancellationToken);
    }

    public Task<StockIssue?> GetByIdAsync(Guid issueId, CancellationToken cancellationToken = default)
    {
        return dbContext.StockIssues
            .AsNoTracking()
            .Include(issue => issue.Lines)
            .FirstOrDefaultAsync(issue => issue.Id == issueId, cancellationToken);
    }

    public Task<StockIssue?> GetByIdForUpdateAsync(Guid issueId, CancellationToken cancellationToken = default)
    {
        return dbContext.StockIssues
            .Include(issue => issue.Lines)
            .FirstOrDefaultAsync(issue => issue.Id == issueId, cancellationToken);
    }

    public async Task<IReadOnlyCollection<StockIssue>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.StockIssues
            .AsNoTracking()
            .Include(issue => issue.Lines)
            .OrderByDescending(issue => issue.IssuedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public void AddLines(IEnumerable<StockIssueLine> lines)
    {
        dbContext.Set<StockIssueLine>().AddRange(lines);
    }

    public void Remove(StockIssue issue)
    {
        dbContext.StockIssues.Remove(issue);
    }
}

