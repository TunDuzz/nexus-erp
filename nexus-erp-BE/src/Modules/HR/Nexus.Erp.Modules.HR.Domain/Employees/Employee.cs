using Nexus.Erp.SharedKernel.Domain;

namespace Nexus.Erp.Modules.HR.Domain.Employees;

public sealed class Employee : Entity<Guid>
{
    private Employee()
    {
    }

    public Employee(Guid id, string employeeCode, string fullName, string email)
        : base(id)
    {
        EmployeeCode = employeeCode;
        FullName = fullName;
        Email = email;
    }

    public string EmployeeCode { get; private set; } = string.Empty;

    public string FullName { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;
}
