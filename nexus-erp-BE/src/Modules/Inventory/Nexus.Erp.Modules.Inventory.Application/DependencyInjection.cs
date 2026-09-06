using Microsoft.Extensions.DependencyInjection;

namespace Nexus.Erp.Modules.Inventory.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddInventoryApplication(this IServiceCollection services)
    {
        services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(AssemblyReference.Assembly));

        return services;
    }
}
