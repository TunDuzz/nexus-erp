using MediatR;
using Nexus.Erp.Modules.Identity.Application.Abstractions;
using Nexus.Erp.Modules.Identity.Application.Auth;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.Identity.Application.Auth.Register;

internal sealed class RegisterUserCommandHandler(IAuthenticationService authenticationService)
    : IRequestHandler<RegisterUserCommand, Result<AuthResponse>>
{
    public Task<Result<AuthResponse>> Handle(
        RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        return authenticationService.RegisterAsync(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            cancellationToken);
    }
}
