using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nexus.Erp.Infrastructure.Shared.Persistence;
using Nexus.Erp.Modules.Identity.Infrastructure.Identity;
using Nexus.Erp.Modules.Identity.Infrastructure.Persistence;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Nexus.Erp.Modules.Identity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("NexusErpIdentity")
            ?? throw new InvalidOperationException("Connection string 'NexusErpIdentity' was not found.");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

        services.AddDbContext<NexusIdentityDbContext>(options =>
            options.UseMySql(
                connectionString,
                serverVersion,
                mySql => mySql.MigrationsHistoryTable("__EFMigrationsHistory")));

        services
            .AddIdentityCore<NexusUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
            })
            .AddRoles<NexusRole>()
            .AddEntityFrameworkStores<NexusIdentityDbContext>();

        return services;
    }
}
