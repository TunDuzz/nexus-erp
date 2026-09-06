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
    RoleManager<NexusRole> roleManager,
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

        var addToRoleResult = await userManager.AddToRoleAsync(user, RoleConstants.DefaultRole);

        if (!addToRoleResult.Succeeded)
        {
            return Result<AuthResponse>.Failure(ToError(addToRoleResult));
        }

        return await CreateAuthResponseAsync(user);
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

        return await CreateAuthResponseAsync(user);
    }

    private async Task<Result<AuthResponse>> CreateAuthResponseAsync(NexusUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var permissions = await GetPermissionsAsync(user, roles);
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        var accessToken = jwtTokenGenerator.GenerateToken(user.Id, user.Email!, fullName, roles.ToArray(), permissions);
        var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(jwtOptions.Value.ExpirationMinutes);

        return Result<AuthResponse>.Success(
            new AuthResponse(user.Id, user.Email!, fullName, accessToken, expiresAtUtc, roles.ToArray(), permissions));
    }

    private async Task<IReadOnlyCollection<string>> GetPermissionsAsync(NexusUser user, IEnumerable<string> roles)
    {
        var permissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var userClaims = await userManager.GetClaimsAsync(user);

        foreach (var claim in userClaims.Where(claim => claim.Type == "permission"))
        {
            permissions.Add(claim.Value);
        }

        foreach (var roleName in roles)
        {
            var role = await roleManager.FindByNameAsync(roleName);

            if (role is null)
            {
                continue;
            }

            var roleClaims = await roleManager.GetClaimsAsync(role);

            foreach (var claim in roleClaims.Where(claim => claim.Type == "permission"))
            {
                permissions.Add(claim.Value);
            }
        }

        return permissions.Order().ToArray();
    }

    private static Error ToError(IdentityResult identityResult)
    {
        var description = string.Join("; ", identityResult.Errors.Select(error => error.Description));

        return new Error("Identity.OperationFailed", description);
    }
}
