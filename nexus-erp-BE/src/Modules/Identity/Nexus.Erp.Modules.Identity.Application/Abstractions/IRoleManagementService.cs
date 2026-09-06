using Nexus.Erp.Modules.Identity.Application.Auth;
using Nexus.Erp.Modules.Identity.Application.Roles;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Application.Abstractions;

public interface IRoleManagementService
{
    Task<Result<IReadOnlyCollection<RoleResponse>>> GetRolesAsync(CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyCollection<UserRoleResponse>>> GetUsersAsync(CancellationToken cancellationToken = default);

    Task<Result<UserRoleResponse>> UpdateUserRolesAsync(
        Guid userId,
        IReadOnlyCollection<string> roles,
        CancellationToken cancellationToken = default);
}
