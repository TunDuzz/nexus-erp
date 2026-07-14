using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Nexus.Erp.Modules.Inventory.Application.Products.AdjustProductStock;
using Nexus.Erp.Modules.Inventory.Application.Products.CreateProduct;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProducts;
using Nexus.Erp.Modules.Inventory.Application.Products.UpdateProduct;

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
            new UpdateProductCommand(sku, request.Name, request.UnitPrice, request.ReorderLevel),
            cancellationToken);

        return ToProductResult(result);
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

        return ToProductResult(result);
    }

    private static IResult ToProductResult<TValue>(Nexus.Erp.SharedKernel.Errors.Result<TValue> result)
    {
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        return result.Error.Code == "Inventory.ProductNotFound"
            ? Results.NotFound(new { result.Error.Code, result.Error.Description })
            : Results.BadRequest(new { result.Error.Code, result.Error.Description });
    }

    private sealed record CreateProductRequest(
        string Sku,
        string Name,
        decimal UnitPrice,
        int InitialQuantity,
        int ReorderLevel);

    private sealed record UpdateProductRequest(
        string Name,
        decimal UnitPrice,
        int ReorderLevel);

    private sealed record AdjustProductStockRequest(
        int QuantityChange,
        string? Reason);
}
