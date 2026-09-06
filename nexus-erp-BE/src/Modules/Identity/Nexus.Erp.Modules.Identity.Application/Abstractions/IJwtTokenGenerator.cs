namespace Nexus.Erp.Modules.Identity.Application.Abstractions;

public interface IJwtTokenGenerator
{
    string GenerateToken(
        Guid userId,
        string email,
        string fullName,
        IReadOnlyCollection<string> roles,
        IReadOnlyCollection<string> permissions);
}
