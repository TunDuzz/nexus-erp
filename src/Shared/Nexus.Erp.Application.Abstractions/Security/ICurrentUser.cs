namespace Nexus.Erp.Application.Abstractions.Security;

public interface ICurrentUser
{
    Guid? UserId { get; }

    string? UserName { get; }

    bool IsAuthenticated { get; }

    bool IsInRole(string role);
}
