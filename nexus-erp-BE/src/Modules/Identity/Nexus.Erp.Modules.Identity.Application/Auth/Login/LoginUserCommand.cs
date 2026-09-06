using Nexus.Erp.Application.Abstractions.Messaging;
using Nexus.Erp.Modules.Identity.Application.Auth;

namespace Nexus.Erp.Modules.Identity.Application.Auth.Login;

public sealed record LoginUserCommand(string Email, string Password) : ICommand<AuthResponse>;
