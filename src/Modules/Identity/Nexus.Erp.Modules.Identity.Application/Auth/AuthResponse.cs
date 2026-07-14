namespace Nexus.Erp.Modules.Identity.Application.Auth;

public sealed record AuthResponse(
    Guid UserId,
    string Email,
    string FullName,
    string AccessToken,
    DateTimeOffset ExpiresAtUtc,
    IReadOnlyCollection<string> Permissions);
