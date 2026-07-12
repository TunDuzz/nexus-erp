using Microsoft.Extensions.DependencyInjection;

namespace Nexus.Erp.Modules.Identity.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityApplication(this IServiceCollection services)
    {
        services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(AssemblyReference.Assembly));

        return services;
    }
}
