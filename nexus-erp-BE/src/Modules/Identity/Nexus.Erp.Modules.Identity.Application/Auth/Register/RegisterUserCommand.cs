using Nexus.Erp.Application.Abstractions.Messaging;
using Nexus.Erp.Modules.Identity.Application.Auth;

namespace Nexus.Erp.Modules.Identity.Application.Auth.Register;

public sealed record RegisterUserCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName) : ICommand<AuthResponse>;
