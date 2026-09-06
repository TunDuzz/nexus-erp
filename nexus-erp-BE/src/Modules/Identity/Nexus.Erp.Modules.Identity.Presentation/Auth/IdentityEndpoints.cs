using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Nexus.Erp.Modules.Identity.Application.Auth.Login;
using Nexus.Erp.Modules.Identity.Application.Auth.Register;
using Nexus.Erp.Modules.Identity.Application.Roles;
using Nexus.Erp.Modules.Identity.Application.Roles.GetRoles;
using Nexus.Erp.Modules.Identity.Application.Roles.GetUsers;
using Nexus.Erp.Modules.Identity.Application.Roles.UpdateUserRoles;
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
                    Email = httpContext.User.FindFirst(ClaimTypes.Email)?.Value,
                    Roles = httpContext.User.FindAll(ClaimTypes.Role).Select(claim => claim.Value).ToArray(),
                    Permissions = httpContext.User.FindAll("permission").Select(claim => claim.Value).ToArray()
                })
                : Results.Unauthorized())
            .RequireAuthorization()
            .WithName("Identity.Me");

        group.MapGet("/roles", GetRolesAsync)
            .RequireAuthorization("CanManageIdentity")
            .WithName("Identity.GetRoles");

        group.MapGet("/users", GetUsersAsync)
            .RequireAuthorization("CanManageIdentity")
            .WithName("Identity.GetUsers");

        group.MapPut("/users/{userId:guid}/roles", UpdateUserRolesAsync)
            .RequireAuthorization("CanManageIdentity")
            .WithName("Identity.UpdateUserRoles");

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

    private static async Task<IResult> GetRolesAsync(
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetRolesQuery(), cancellationToken);

        return ToResult(result);
    }

    private static async Task<IResult> GetUsersAsync(
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetUsersQuery(), cancellationToken);

        return ToResult(result);
    }

    private static async Task<IResult> UpdateUserRolesAsync(
        Guid userId,
        UpdateUserRolesRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new UpdateUserRolesCommand(userId, request.Roles), cancellationToken);

        return ToResult(result);
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

    private static IResult ToResult<TValue>(Result<TValue> result)
    {
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        return result.Error.Code == "Identity.UserNotFound"
            ? Results.NotFound(new { result.Error.Code, result.Error.Description })
            : Results.BadRequest(new { result.Error.Code, result.Error.Description });
    }

    private sealed record RegisterUserRequest(
        string Email,
        string Password,
        string FirstName,
        string LastName);

    private sealed record LoginUserRequest(string Email, string Password);

    private sealed record UpdateUserRolesRequest(IReadOnlyCollection<string> Roles);
}
