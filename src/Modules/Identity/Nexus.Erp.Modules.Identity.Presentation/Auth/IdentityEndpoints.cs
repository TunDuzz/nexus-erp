using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Nexus.Erp.Modules.Identity.Presentation.Auth;

public static class IdentityEndpoints
{
    public static IEndpointRouteBuilder MapIdentityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/identity")
            .WithTags("Identity");

        group.MapGet("/me", (HttpContext httpContext) =>
            httpContext.User.Identity?.IsAuthenticated == true
                ? Results.Ok(new { httpContext.User.Identity.Name })
                : Results.Unauthorized())
            .RequireAuthorization()
            .WithName("Identity.Me");

        return app;
    }
}
