using Nexus.Erp.Modules.Identity.Application.Auth;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Application.Abstractions;

public interface IAuthenticationService
{
    Task<Result<AuthResponse>> RegisterAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        CancellationToken cancellationToken = default);

    Task<Result<AuthResponse>> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);
}
