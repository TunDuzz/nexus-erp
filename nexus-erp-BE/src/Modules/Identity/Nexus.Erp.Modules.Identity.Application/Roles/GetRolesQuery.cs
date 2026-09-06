using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Identity.Application.Roles.GetRoles;

public sealed record GetRolesQuery : IQuery<IReadOnlyCollection<RoleResponse>>;
