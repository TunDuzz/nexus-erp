using Microsoft.Extensions.DependencyInjection;

namespace Nexus.Erp.Modules.HR.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddHrApplication(this IServiceCollection services)
    {
        services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(AssemblyReference.Assembly));

        return services;
    }
}
