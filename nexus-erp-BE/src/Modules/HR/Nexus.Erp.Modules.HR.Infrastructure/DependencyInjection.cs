using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nexus.Erp.Modules.HR.Application.Abstractions.Data;
using Nexus.Erp.Modules.HR.Infrastructure.Persistence;
using Nexus.Erp.Modules.HR.Infrastructure.Repositories;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Nexus.Erp.Modules.HR.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddHrInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("NexusErpHr")
            ?? throw new InvalidOperationException("Connection string 'NexusErpHr' was not found.");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 46));

        services.AddDbContext<HrDbContext>(options =>
            options.UseMySql(
                connectionString,
                serverVersion,
                mySql => mySql.MigrationsHistoryTable("__EFMigrationsHistory")));

        services.AddScoped<IEmployeeReadRepository, EmployeeReadRepository>();

        return services;
    }
}
