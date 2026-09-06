using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Inventory.Application.StockReceipts.DeleteStockReceipt;

public sealed record DeleteStockReceiptCommand(Guid ReceiptId) : ICommand;
