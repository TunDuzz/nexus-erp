using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Nexus.Erp.Infrastructure.Shared.Persistence;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Nexus.Erp.Modules.Inventory.Infrastructure.Persistence;

public sealed class InventoryDbContextFactory : IDesignTimeDbContextFactory<InventoryDbContext>
{
    public InventoryDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<InventoryDbContext>();
        var connectionString = DesignTimeConfiguration.GetConnectionString("NexusErpInventory");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 46));

        optionsBuilder.UseMySql(
            connectionString,
            serverVersion,
            mySql => mySql.MigrationsHistoryTable("__EFMigrationsHistory"));

        return new InventoryDbContext(optionsBuilder.Options);
    }
}
