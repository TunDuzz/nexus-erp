using Nexus.Erp.Application.Abstractions.Messaging;

namespace Nexus.Erp.Modules.HR.Application.Employees.GetEmployeeById;

public sealed record GetEmployeeByIdQuery(Guid EmployeeId) : IQuery<EmployeeResponse>;
