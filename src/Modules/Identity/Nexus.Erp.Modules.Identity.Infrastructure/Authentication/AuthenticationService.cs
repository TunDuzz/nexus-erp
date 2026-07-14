using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Nexus.Erp.Modules.Identity.Application.Abstractions;
using Nexus.Erp.Modules.Identity.Application.Auth;
using Nexus.Erp.Modules.Identity.Infrastructure.Identity;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Infrastructure.Authentication;

internal sealed class AuthenticationService(
    UserManager<NexusUser> userManager,
    IJwtTokenGenerator jwtTokenGenerator,
    IOptions<JwtOptions> jwtOptions) : IAuthenticationService
{
    public async Task<Result<AuthResponse>> RegisterAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim();
        var existingUser = await userManager.FindByEmailAsync(normalizedEmail);

        if (existingUser is not null)
        {
            return Result<AuthResponse>.Failure(
                new Error("Identity.EmailAlreadyInUse", "Email is already registered."));
        }

        var user = new NexusUser
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            UserName = normalizedEmail,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim()
        };

        var createResult = await userManager.CreateAsync(user, password);

        if (!createResult.Succeeded)
        {
            return Result<AuthResponse>.Failure(ToError(createResult));
        }

        var permissionClaims = PermissionConstants.DefaultUserPermissions
            .Select(permission => new Claim("permission", permission));
        var addClaimsResult = await userManager.AddClaimsAsync(user, permissionClaims);

        if (!addClaimsResult.Succeeded)
        {
            return Result<AuthResponse>.Failure(ToError(addClaimsResult));
        }

        return CreateAuthResponse(user, PermissionConstants.DefaultUserPermissions);
    }

    public async Task<Result<AuthResponse>> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(email.Trim());

        if (user is null || !await userManager.CheckPasswordAsync(user, password))
        {
            return Result<AuthResponse>.Failure(
                new Error("Identity.InvalidCredentials", "Email or password is incorrect."));
        }

        var permissions = await GetPermissionsAsync(user);

        return CreateAuthResponse(user, permissions);
    }

    private async Task<IReadOnlyCollection<string>> GetPermissionsAsync(NexusUser user)
    {
        var claims = await userManager.GetClaimsAsync(user);

        return claims
            .Where(claim => claim.Type == "permission")
            .Select(claim => claim.Value)
            .Distinct()
            .ToArray();
    }

    private Result<AuthResponse> CreateAuthResponse(
        NexusUser user,
        IReadOnlyCollection<string> permissions)
    {
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        var accessToken = jwtTokenGenerator.GenerateToken(user.Id, user.Email!, fullName, permissions);
        var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(jwtOptions.Value.ExpirationMinutes);

        return Result<AuthResponse>.Success(
            new AuthResponse(user.Id, user.Email!, fullName, accessToken, expiresAtUtc, permissions));
    }

    private static Error ToError(IdentityResult identityResult)
    {
        var description = string.Join("; ", identityResult.Errors.Select(error => error.Description));

        return new Error("Identity.OperationFailed", description);
    }
}
