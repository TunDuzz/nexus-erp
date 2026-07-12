using Microsoft.AspNetCore.Identity;

namespace Nexus.Erp.Modules.Identity.Infrastructure.Identity;

public sealed class NexusUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;
}
