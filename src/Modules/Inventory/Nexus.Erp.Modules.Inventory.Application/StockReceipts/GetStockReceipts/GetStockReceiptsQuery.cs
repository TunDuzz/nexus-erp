using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.GetStockReceipts;

public sealed record GetStockReceiptsQuery : IQuery<IReadOnlyCollection<StockReceiptResponse>>;
