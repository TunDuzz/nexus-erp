using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Infrastructure.Shared.Persistence;
using Nexus.Erp.Modules.HR.Domain.Employees;

namespace Nexus.Erp.Modules.HR.Infrastructure.Persistence;

public sealed class HrDbContext(DbContextOptions<HrDbContext> options) : DbContext(options)
{
    public DbSet<Employee> Employees => Set<Employee>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Employee>(builder =>
        {
            builder.ToTable("employees");
            builder.HasKey(employee => employee.Id);
            builder.Property(employee => employee.EmployeeCode).HasMaxLength(32).IsRequired();
            builder.Property(employee => employee.FullName).HasMaxLength(200).IsRequired();
            builder.Property(employee => employee.Email).HasMaxLength(320).IsRequired();
            builder.HasIndex(employee => employee.EmployeeCode).IsUnique();
        });
    }
}
