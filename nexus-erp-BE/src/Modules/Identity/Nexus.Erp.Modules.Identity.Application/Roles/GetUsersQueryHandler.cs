using MediatR;
using Nexus.Erp.Modules.Identity.Application.Abstractions;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Application.Roles.GetUsers;

internal sealed class GetUsersQueryHandler(IRoleManagementService roleManagementService)
    : IRequestHandler<GetUsersQuery, Result<IReadOnlyCollection<UserRoleResponse>>>
{
    public Task<Result<IReadOnlyCollection<UserRoleResponse>>> Handle(
        GetUsersQuery request,
        CancellationToken cancellationToken)
    {
        return roleManagementService.GetUsersAsync(cancellationToken);
    }
}
