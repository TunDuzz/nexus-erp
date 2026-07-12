using MediatR;
using Nexus.Erp.Modules.HR.Application.Abstractions.Data;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Modules.HR.Application.Employees.GetEmployeeById;

internal sealed class GetEmployeeByIdQueryHandler(IEmployeeReadRepository employees)
    : IRequestHandler<GetEmployeeByIdQuery, Result<EmployeeResponse>>
{
    public async Task<Result<EmployeeResponse>> Handle(
        GetEmployeeByIdQuery request,
        CancellationToken cancellationToken)
    {
        var employee = await employees.GetByIdAsync(request.EmployeeId, cancellationToken);

        if (employee is null)
        {
            return Result<EmployeeResponse>.Failure(new Error("HR.EmployeeNotFound", "Employee was not found."));
        }

        return Result<EmployeeResponse>.Success(
            new EmployeeResponse(employee.Id, employee.EmployeeCode, employee.FullName, employee.Email));
    }
}
