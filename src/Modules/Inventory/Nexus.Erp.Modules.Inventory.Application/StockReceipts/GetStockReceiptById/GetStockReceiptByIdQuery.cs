using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.GetStockReceiptById;

public sealed record GetStockReceiptByIdQuery(Guid ReceiptId) : IQuery<StockReceiptResponse>;
