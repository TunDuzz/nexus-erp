using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Nexus.Erp.Modules.Identity.Application.Auth;
using Nexus.Erp.Modules.Identity.Infrastructure.Identity;

namespace Nexus.Erp.Modules.Identity.Infrastructure.Roles;

internal sealed class IdentityRoleSeeder(
    IServiceScopeFactory serviceScopeFactory,
    IConfiguration configuration) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = serviceScopeFactory.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<NexusRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<NexusUser>>();

        foreach (var roleName in RoleConstants.All)
        {
            var role = await EnsureRoleAsync(roleManager, roleName);
            await SyncRolePermissionsAsync(roleManager, role, RoleConstants.GetPermissions(roleName));
        }

        if (configuration.GetValue<bool>("Identity:BootstrapFirstUserAsAdmin"))
        {
            await BootstrapFirstUserAsAdminAsync(userManager, cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    private static async Task<NexusRole> EnsureRoleAsync(RoleManager<NexusRole> roleManager, string roleName)
    {
        var role = await roleManager.FindByNameAsync(roleName);

        if (role is not null)
        {
            return role;
        }

        role = new NexusRole
        {
            Id = Guid.NewGuid(),
            Name = roleName,
            NormalizedName = roleName.ToUpperInvariant()
        };

        var createResult = await roleManager.CreateAsync(role);

        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to create role '{roleName}': {ToDescription(createResult)}");
        }

        return role;
    }

    private static async Task SyncRolePermissionsAsync(
        RoleManager<NexusRole> roleManager,
        NexusRole role,
        IReadOnlyCollection<string> permissions)
    {
        var currentClaims = await roleManager.GetClaimsAsync(role);
        var currentPermissionClaims = currentClaims
            .Where(claim => claim.Type == "permission")
            .ToArray();

        foreach (var permission in permissions.Where(permission =>
            currentPermissionClaims.All(claim => claim.Value != permission)))
        {
            var addResult = await roleManager.AddClaimAsync(role, new Claim("permission", permission));

            if (!addResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to add permission '{permission}' to role '{role.Name}': {ToDescription(addResult)}");
            }
        }

        foreach (var staleClaim in currentPermissionClaims.Where(claim => !permissions.Contains(claim.Value)))
        {
            var removeResult = await roleManager.RemoveClaimAsync(role, staleClaim);

            if (!removeResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to remove permission '{staleClaim.Value}' from role '{role.Name}': {ToDescription(removeResult)}");
            }
        }
    }

    private static async Task BootstrapFirstUserAsAdminAsync(
        UserManager<NexusUser> userManager,
        CancellationToken cancellationToken)
    {
        var admins = await userManager.GetUsersInRoleAsync(RoleConstants.Admin);

        if (admins.Count > 0)
        {
            return;
        }

        var firstUser = await userManager.Users
            .OrderBy(user => user.Email)
            .FirstOrDefaultAsync(cancellationToken);

        if (firstUser is null)
        {
            return;
        }

        var addResult = await userManager.AddToRoleAsync(firstUser, RoleConstants.Admin);

        if (!addResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to bootstrap first admin user: {ToDescription(addResult)}");
        }
    }

    private static string ToDescription(IdentityResult identityResult)
    {
        return string.Join("; ", identityResult.Errors.Select(error => error.Description));
    }
}
