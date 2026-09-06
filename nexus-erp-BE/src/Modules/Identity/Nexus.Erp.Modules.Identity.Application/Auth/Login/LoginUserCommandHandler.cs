using MediatR;
using Nexus.Erp.Modules.Identity.Application.Abstractions;
using Nexus.Erp.Modules.Identity.Application.Auth;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Application.Auth.Login;

internal sealed class LoginUserCommandHandler(IAuthenticationService authenticationService)
    : IRequestHandler<LoginUserCommand, Result<AuthResponse>>
{
    public Task<Result<AuthResponse>> Handle(
        LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        return authenticationService.LoginAsync(request.Email, request.Password, cancellationToken);
    }
}
