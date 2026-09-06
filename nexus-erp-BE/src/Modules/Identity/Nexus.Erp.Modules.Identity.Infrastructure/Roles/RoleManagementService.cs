using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Modules.Identity.Application.Abstractions;
using Nexus.Erp.Modules.Identity.Application.Auth;
using Nexus.Erp.Modules.Identity.Application.Roles;
using Nexus.Erp.Modules.Identity.Infrastructure.Identity;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Infrastructure.Roles;

internal sealed class RoleManagementService(
    UserManager<NexusUser> userManager) : IRoleManagementService
{
    public Task<Result<IReadOnlyCollection<RoleResponse>>> GetRolesAsync(
        CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<RoleResponse> roles = RoleConstants.All
            .Select(role => new RoleResponse(role, RoleConstants.GetPermissions(role).Order().ToArray()))
            .ToArray();

        return Task.FromResult(Result<IReadOnlyCollection<RoleResponse>>.Success(roles));
    }

    public async Task<Result<IReadOnlyCollection<UserRoleResponse>>> GetUsersAsync(
        CancellationToken cancellationToken = default)
    {
        var users = await userManager.Users
            .OrderBy(user => user.Email)
            .ToListAsync(cancellationToken);

        var responses = new List<UserRoleResponse>();

        foreach (var user in users)
        {
            responses.Add(await CreateUserRoleResponseAsync(user));
        }

        return Result<IReadOnlyCollection<UserRoleResponse>>.Success(responses);
    }

    public async Task<Result<UserRoleResponse>> UpdateUserRolesAsync(
        Guid userId,
        IReadOnlyCollection<string> roles,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());

        if (user is null)
        {
            return Result<UserRoleResponse>.Failure(
                new Error("Identity.UserNotFound", "User was not found."));
        }

        var requestedRoles = roles
            .Select(role => role.Trim())
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (requestedRoles.Length == 0)
        {
            return Result<UserRoleResponse>.Failure(
                new Error("Identity.RoleRequired", "At least one role is required."));
        }

        var unknownRoles = requestedRoles
            .Where(role => !RoleConstants.All.Contains(role, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (unknownRoles.Length > 0)
        {
            return Result<UserRoleResponse>.Failure(
                new Error("Identity.UnknownRole", $"Unknown role(s): {string.Join(", ", unknownRoles)}."));
        }

        var currentRoles = await userManager.GetRolesAsync(user);

        if (currentRoles.Contains(RoleConstants.Admin, StringComparer.OrdinalIgnoreCase) &&
            !requestedRoles.Contains(RoleConstants.Admin, StringComparer.OrdinalIgnoreCase) &&
            await IsLastAdminAsync(user))
        {
            return Result<UserRoleResponse>.Failure(
                new Error("Identity.LastAdminRole", "The last admin user cannot lose the Admin role."));
        }

        var rolesToRemove = currentRoles
            .Where(role => !requestedRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            .ToArray();
        var rolesToAdd = requestedRoles
            .Where(role => !currentRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        var removeResult = await userManager.RemoveFromRolesAsync(user, rolesToRemove);

        if (!removeResult.Succeeded)
        {
            return Result<UserRoleResponse>.Failure(ToError(removeResult));
        }

        var addResult = await userManager.AddToRolesAsync(user, rolesToAdd);

        if (!addResult.Succeeded)
        {
            return Result<UserRoleResponse>.Failure(ToError(addResult));
        }

        return Result<UserRoleResponse>.Success(await CreateUserRoleResponseAsync(user));
    }

    private async Task<UserRoleResponse> CreateUserRoleResponseAsync(NexusUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var permissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var role in roles)
        {
            foreach (var permission in RoleConstants.GetPermissions(role))
            {
                permissions.Add(permission);
            }
        }

        var userClaims = await userManager.GetClaimsAsync(user);

        foreach (var claim in userClaims.Where(claim => claim.Type == "permission"))
        {
            permissions.Add(claim.Value);
        }

        var fullName = $"{user.FirstName} {user.LastName}".Trim();

        return new UserRoleResponse(
            user.Id,
            user.Email ?? string.Empty,
            fullName,
            roles.Order().ToArray(),
            permissions.Order().ToArray());
    }

    private async Task<bool> IsLastAdminAsync(NexusUser user)
    {
        var admins = await userManager.GetUsersInRoleAsync(RoleConstants.Admin);

        return admins.Count == 1 && admins[0].Id == user.Id;
    }

    private static Error ToError(IdentityResult identityResult)
    {
        var description = string.Join("; ", identityResult.Errors.Select(error => error.Description));

        return new Error("Identity.OperationFailed", description);
    }
}

