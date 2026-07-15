using Nexus.Erp.Modules.Inventory.Domain.StockReceipts;

namespace Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;

public interface IStockReceiptRepository
{
    Task AddAsync(StockReceipt receipt, CancellationToken cancellationToken = default);

    Task<bool> ExistsByReceiptNumberAsync(string receiptNumber, CancellationToken cancellationToken = default);

    Task<StockReceipt?> GetByIdAsync(Guid receiptId, CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<StockReceipt>> GetAllAsync(CancellationToken cancellationToken = default);
}
