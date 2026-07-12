using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nexus.Erp.Modules.Inventory.Application.Abstractions.Data;
using Nexus.Erp.Modules.Inventory.Infrastructure.Persistence;
using Nexus.Erp.Modules.Inventory.Infrastructure.Repositories;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Nexus.Erp.Modules.Inventory.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInventoryInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("NexusErpInventory")
            ?? throw new InvalidOperationException("Connection string 'NexusErpInventory' was not found.");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

        services.AddDbContext<InventoryDbContext>(options =>
            options.UseMySql(
                connectionString,
                serverVersion,
                mySql => mySql.MigrationsHistoryTable("__EFMigrationsHistory")));

        services.AddScoped<IProductReadRepository, ProductReadRepository>();

        return services;
    }
}
