using Microsoft.EntityFrameworkCore;
using Nexus.Erp.Modules.HR.Application.Abstractions.Data;
using Nexus.Erp.Modules.HR.Domain.Employees;
using Nexus.Erp.Modules.HR.Infrastructure.Persistence;

namespace Nexus.Erp.Modules.HR.Infrastructure.Repositories;

internal sealed class EmployeeReadRepository(HrDbContext dbContext) : IEmployeeReadRepository
{
    public Task<Employee?> GetByIdAsync(Guid employeeId, CancellationToken cancellationToken = default)
    {
        return dbContext.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(employee => employee.Id == employeeId, cancellationToken);
    }
}
