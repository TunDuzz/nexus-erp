namespace Nexus.Erp.Modules.Identity.Application.Roles;

public sealed record UserRoleResponse(
    Guid UserId,
    string Email,
    string FullName,
    IReadOnlyCollection<string> Roles,
    IReadOnlyCollection<string> Permissions);
