namespace Nexus.Erp.Modules.Identity.Application.Roles;

public sealed record RoleResponse(
    string Name,
    IReadOnlyCollection<string> Permissions);
