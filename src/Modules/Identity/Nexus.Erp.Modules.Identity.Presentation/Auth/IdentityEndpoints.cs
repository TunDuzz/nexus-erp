using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Nexus.Erp.Modules.Identity.Application.Auth.Login;
using Nexus.Erp.Modules.Identity.Application.Auth.Register;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Presentation.Auth;

public static class IdentityEndpoints
{
    public static IEndpointRouteBuilder MapIdentityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/identity")
            .WithTags("Identity");

        group.MapPost("/register", RegisterAsync)
            .AllowAnonymous()
            .WithName("Identity.Register");

        group.MapPost("/login", LoginAsync)
            .AllowAnonymous()
            .WithName("Identity.Login");

        group.MapGet("/me", (HttpContext httpContext) =>
            httpContext.User.Identity?.IsAuthenticated == true
                ? Results.Ok(new
                {
                    Name = httpContext.User.Identity.Name,
                    Email = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value,
                    Permissions = httpContext.User.FindAll("permission").Select(claim => claim.Value).ToArray()
                })
                : Results.Unauthorized())
            .RequireAuthorization()
            .WithName("Identity.Me");

        return app;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterUserRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new RegisterUserCommand(request.Email, request.Password, request.FirstName, request.LastName),
            cancellationToken);

        return ToAuthResult(result);
    }

    private static async Task<IResult> LoginAsync(
        LoginUserRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new LoginUserCommand(request.Email, request.Password),
            cancellationToken);

        return ToAuthResult(result);
    }

    private static IResult ToAuthResult<TValue>(Result<TValue> result)
    {
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        return result.Error.Code == "Identity.InvalidCredentials"
            ? Results.Unauthorized()
            : Results.BadRequest(new { result.Error.Code, result.Error.Description });
    }

    private sealed record RegisterUserRequest(
        string Email,
        string Password,
        string FirstName,
        string LastName);

    private sealed record LoginUserRequest(string Email, string Password);
}
