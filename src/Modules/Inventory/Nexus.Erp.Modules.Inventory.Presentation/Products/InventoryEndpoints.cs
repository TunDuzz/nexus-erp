using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Nexus.Erp.Modules.Inventory.Application.Products.AdjustProductStock;
using Nexus.Erp.Modules.Inventory.Application.Products.CreateProduct;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProducts;
using Nexus.Erp.Modules.Inventory.Application.Products.UpdateProduct;
using Nexus.Erp.Modules.Inventory.Application.StockIssues.CreateStockIssue;
using Nexus.Erp.Modules.Inventory.Application.StockIssues.GetStockIssueById;
using Nexus.Erp.Modules.Inventory.Application.StockIssues.GetStockIssues;
using Nexus.Erp.Modules.Inventory.Application.StockReceipts.CreateStockReceipt;
using Nexus.Erp.Modules.Inventory.Application.StockReceipts.GetStockReceiptById;
using Nexus.Erp.Modules.Inventory.Application.StockReceipts.GetStockReceipts;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Inventory.Presentation.Products;

public static class InventoryEndpoints
{
    public static IEndpointRouteBuilder MapInventoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventory")
            .WithTags("Inventory");

        group.MapGet("/products", GetProductsAsync)
            .RequireAuthorization("CanReadInventory")
            .WithName("Inventory.GetProducts");

        group.MapGet("/products/{sku}", GetProductBySkuAsync)
            .RequireAuthorization("CanReadInventory")
            .WithName("Inventory.GetProductBySku");

        group.MapPost("/products", CreateProductAsync)
            .RequireAuthorization("CanWriteInventory")
            .WithName("Inventory.CreateProduct");

        group.MapPut("/products/{sku}", UpdateProductAsync)
            .RequireAuthorization("CanWriteInventory")
            .WithName("Inventory.UpdateProduct");

        group.MapPost("/products/{sku}/stock-adjustments", AdjustProductStockAsync)
            .RequireAuthorization("CanWriteInventory")
            .WithName("Inventory.AdjustProductStock");

        group.MapGet("/stock-receipts", GetStockReceiptsAsync)
            .RequireAuthorization("CanReadInventory")
            .WithName("Inventory.GetStockReceipts");

        group.MapGet("/stock-receipts/{receiptId:guid}", GetStockReceiptByIdAsync)
            .RequireAuthorization("CanReadInventory")
            .WithName("Inventory.GetStockReceiptById");

        group.MapPost("/stock-receipts", CreateStockReceiptAsync)
            .RequireAuthorization("CanWriteInventory")
            .WithName("Inventory.CreateStockReceipt");

        group.MapGet("/stock-issues", GetStockIssuesAsync)
            .RequireAuthorization("CanReadInventory")
            .WithName("Inventory.GetStockIssues");

        group.MapGet("/stock-issues/{issueId:guid}", GetStockIssueByIdAsync)
            .RequireAuthorization("CanReadInventory")
            .WithName("Inventory.GetStockIssueById");

        group.MapPost("/stock-issues", CreateStockIssueAsync)
            .RequireAuthorization("CanWriteInventory")
            .WithName("Inventory.CreateStockIssue");

        return app;
    }

    private static async Task<IResult> GetProductsAsync(
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetProductsQuery(), cancellationToken);

        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.BadRequest(new { result.Error.Code, result.Error.Description });
    }

    private static async Task<IResult> GetProductBySkuAsync(
        string sku,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetProductBySkuQuery(sku), cancellationToken);

        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { result.Error.Code, result.Error.Description });
    }

    private static async Task<IResult> CreateProductAsync(
        CreateProductRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new CreateProductCommand(
                request.Sku,
                request.Name,
                request.UnitOfMeasure,
                request.UnitPrice,
                request.InitialQuantity,
                request.ReorderLevel),
            cancellationToken);

        return result.IsSuccess
            ? Results.Created($"/api/inventory/products/{result.Value.Sku}", result.Value)
            : Results.BadRequest(new { result.Error.Code, result.Error.Description });
    }

    private static async Task<IResult> UpdateProductAsync(
        string sku,
        UpdateProductRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateProductCommand(sku, request.Name, request.UnitOfMeasure, request.UnitPrice, request.ReorderLevel),
            cancellationToken);

        return ToInventoryResult(result);
    }

    private static async Task<IResult> AdjustProductStockAsync(
        string sku,
        AdjustProductStockRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new AdjustProductStockCommand(sku, request.QuantityChange, request.Reason),
            cancellationToken);

        return ToInventoryResult(result);
    }

    private static async Task<IResult> GetStockReceiptsAsync(
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStockReceiptsQuery(), cancellationToken);

        return ToInventoryResult(result);
    }

    private static async Task<IResult> GetStockReceiptByIdAsync(
        Guid receiptId,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStockReceiptByIdQuery(receiptId), cancellationToken);

        return ToInventoryResult(result);
    }

    private static async Task<IResult> CreateStockReceiptAsync(
        CreateStockReceiptRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new CreateStockReceiptCommand(
                request.ReceiptNumber,
                request.SupplierName,
                request.ReceivedAtUtc,
                request.Note,
                request.Lines
                    .Select(line => new CreateStockReceiptLine(line.Sku, line.Quantity, line.UnitCost))
                    .ToArray()),
            cancellationToken);

        return result.IsSuccess
            ? Results.Created($"/api/inventory/stock-receipts/{result.Value.Id}", result.Value)
            : ToInventoryResult(result);
    }

    private static async Task<IResult> GetStockIssuesAsync(
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStockIssuesQuery(), cancellationToken);

        return ToInventoryResult(result);
    }

    private static async Task<IResult> GetStockIssueByIdAsync(
        Guid issueId,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStockIssueByIdQuery(issueId), cancellationToken);

        return ToInventoryResult(result);
    }

    private static async Task<IResult> CreateStockIssueAsync(
        CreateStockIssueRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new CreateStockIssueCommand(
                request.IssueNumber,
                request.RequestedBy,
                request.IssuedAtUtc,
                request.Note,
                request.Lines
                    .Select(line => new CreateStockIssueLine(line.Sku, line.Quantity, line.Reason))
                    .ToArray()),
            cancellationToken);

        return result.IsSuccess
            ? Results.Created($"/api/inventory/stock-issues/{result.Value.Id}", result.Value)
            : ToInventoryResult(result);
    }

    private static IResult ToInventoryResult<TValue>(Result<TValue> result)
    {
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        return result.Error.Code is "Inventory.ProductNotFound" or "Inventory.StockReceiptNotFound" or "Inventory.StockIssueNotFound"
            ? Results.NotFound(new { result.Error.Code, result.Error.Description })
            : Results.BadRequest(new { result.Error.Code, result.Error.Description });
    }

    private sealed record CreateProductRequest(
        string Sku,
        string Name,
        string UnitOfMeasure,
        decimal UnitPrice,
        int InitialQuantity,
        int ReorderLevel);

    private sealed record UpdateProductRequest(
        string Name,
        string UnitOfMeasure,
        decimal UnitPrice,
        int ReorderLevel);

    private sealed record AdjustProductStockRequest(
        int QuantityChange,
        string? Reason);

    private sealed record CreateStockReceiptRequest(
        string ReceiptNumber,
        string SupplierName,
        DateTimeOffset? ReceivedAtUtc,
        string? Note,
        IReadOnlyCollection<CreateStockReceiptLineRequest> Lines);

    private sealed record CreateStockReceiptLineRequest(
        string Sku,
        int Quantity,
        decimal UnitCost);

    private sealed record CreateStockIssueRequest(
        string IssueNumber,
        string RequestedBy,
        DateTimeOffset? IssuedAtUtc,
        string? Note,
        IReadOnlyCollection<CreateStockIssueLineRequest> Lines);

    private sealed record CreateStockIssueLineRequest(
        string Sku,
        int Quantity,
        string? Reason);
}
