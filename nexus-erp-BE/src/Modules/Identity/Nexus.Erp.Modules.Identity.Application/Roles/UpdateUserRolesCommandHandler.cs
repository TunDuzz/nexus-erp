using MediatR;
using Nexus.Erp.Modules.Identity.Application.Abstractions;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Application.Roles.UpdateUserRoles;

internal sealed class UpdateUserRolesCommandHandler(IRoleManagementService roleManagementService)
    : IRequestHandler<UpdateUserRolesCommand, Result<UserRoleResponse>>
{
    public Task<Result<UserRoleResponse>> Handle(
        UpdateUserRolesCommand request,
        CancellationToken cancellationToken)
    {
        return roleManagementService.UpdateUserRolesAsync(
            request.UserId,
            request.Roles,
            cancellationToken);
    }
}
