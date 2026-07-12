using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Nexus.Erp.Modules.Inventory.Application.Products.GetProductBySku;

namespace Nexus.Erp.Modules.Inventory.Presentation.Products;

public static class InventoryEndpoints
{
    public static IEndpointRouteBuilder MapInventoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventory")
            .WithTags("Inventory")
            .RequireAuthorization("CanReadInventory");

        group.MapGet("/products/{sku}", GetProductBySkuAsync)
            .WithName("Inventory.GetProductBySku");

        return app;
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
}
