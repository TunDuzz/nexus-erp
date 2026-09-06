using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Nexus.Erp.Infrastructure.Shared.Persistence;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Nexus.Erp.Modules.Identity.Infrastructure.Persistence;

public sealed class NexusIdentityDbContextFactory : IDesignTimeDbContextFactory<NexusIdentityDbContext>
{
    public NexusIdentityDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<NexusIdentityDbContext>();
        var connectionString = DesignTimeConfiguration.GetConnectionString("NexusErpIdentity");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 46));

        optionsBuilder.UseMySql(
            connectionString,
            serverVersion,
            mySql => mySql.MigrationsHistoryTable("__EFMigrationsHistory"));

        return new NexusIdentityDbContext(optionsBuilder.Options);
    }
}
