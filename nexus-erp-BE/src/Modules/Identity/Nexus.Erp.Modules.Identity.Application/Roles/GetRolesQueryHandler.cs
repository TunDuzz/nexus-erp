using MediatR;
using Nexus.Erp.Modules.Identity.Application.Abstractions;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Application.Roles.GetRoles;

internal sealed class GetRolesQueryHandler(IRoleManagementService roleManagementService)
    : IRequestHandler<GetRolesQuery, Result<IReadOnlyCollection<RoleResponse>>>
{
    public Task<Result<IReadOnlyCollection<RoleResponse>>> Handle(
        GetRolesQuery request,
        CancellationToken cancellationToken)
    {
        return roleManagementService.GetRolesAsync(cancellationToken);
    }
}
