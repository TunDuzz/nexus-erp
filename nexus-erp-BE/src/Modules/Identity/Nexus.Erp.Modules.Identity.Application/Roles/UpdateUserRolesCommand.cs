using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Identity.Application.Roles.UpdateUserRoles;

public sealed record UpdateUserRolesCommand(
    Guid UserId,
    IReadOnlyCollection<string> Roles) : ICommand<UserRoleResponse>;
