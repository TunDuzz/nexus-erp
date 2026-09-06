using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.Identity.Application.Roles.GetUsers;

public sealed record GetUsersQuery : IQuery<IReadOnlyCollection<UserRoleResponse>>;
