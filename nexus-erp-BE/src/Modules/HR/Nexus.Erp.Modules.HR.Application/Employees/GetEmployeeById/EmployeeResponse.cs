namespace Nexus.Erp.Modules.HR.Application.Employees.GetEmployeeById;

public sealed record EmployeeResponse(Guid Id, string EmployeeCode, string FullName, string Email);
