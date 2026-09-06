using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Nexus.Erp.Infrastructure.Shared.Persistence;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Nexus.Erp.Modules.HR.Infrastructure.Persistence;

public sealed class HrDbContextFactory : IDesignTimeDbContextFactory<HrDbContext>
{
    public HrDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<HrDbContext>();
        var connectionString = DesignTimeConfiguration.GetConnectionString("NexusErpHr");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 46));

        optionsBuilder.UseMySql(
            connectionString,
            serverVersion,
            mySql => mySql.MigrationsHistoryTable("__EFMigrationsHistory"));

        return new HrDbContext(optionsBuilder.Options);
    }
}
