using Nexus.Erp.Modules.Inventory.Domain.StockIssues;

namespace Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;

public interface IStockIssueRepository
{
    Task AddAsync(StockIssue issue, CancellationToken cancellationToken = default);

    Task<bool> ExistsByIssueNumberAsync(string issueNumber, CancellationToken cancellationToken = default);

    Task<StockIssue?> GetByIdAsync(Guid issueId, CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<StockIssue>> GetAllAsync(CancellationToken cancellationToken = default);
}
