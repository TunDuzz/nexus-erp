using Nexus.Erp.Modules.HR.Domain.Employees;

namespace Nexus.Erp.Modules.HR.Application.Abstractions.Data;

public interface IEmployeeReadRepository
{
    Task<Employee?> GetByIdAsync(Guid employeeId, CancellationToken cancellationToken = default);
}
